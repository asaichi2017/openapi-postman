var fs = require('fs'), // needed to read JSON file from disk
  Collection = require('postman-collection').Collection,
  myCollection;

// Load a collection to memory from a JSON file on disk (say, sample-collection.json)
myCollection = new Collection(JSON.parse(fs.readFileSync('collection.json').toString()));

// log items at root level of the collection
myCollection.events.add({
  listen: 'prerequest',
  script: {
    exec: `
// CSRF対策用のトークンを取りに行ってヘッダに差し込む
const host = pm.collectionVariables.get("baseUrl");
let csrfRequestUrl = host + '/sanctum/csrf-cookie';
pm.sendRequest(csrfRequestUrl, (err, res, {cookies}) => {
    let xsrfCookie = cookies.one('XSRF-TOKEN');
    if (xsrfCookie) {
        let xsrfToken = decodeURIComponent(xsrfCookie['value']);
        pm.request.headers.upsert({
            key: 'X-XSRF-TOKEN',
            value: xsrfToken,
        });
     
    }
});

// Refererを常ににAPIのHOSTと一緒にする
pm.request.headers.upsert({
    key: 'Referer',
    value: host,
});    

// Acceptをapplication/jsonに
pm.request.headers.upsert({
    key: 'Accept',
    value: 'application/json',
});    

if (pm.request.url.path[0] === 'login') {
    pm.request.body.raw = pm.request.body.raw.replace(/<email>/,pm.environment.get('email'))
    .replace(/<string>/,pm.environment.get('password'))
}
    `
  },
  type: 'text/javascript'
})
// console.log(myCollection.toJSON());
fs.writeFile('converted-collection.json', JSON.stringify(myCollection, null, 4), (err) => {
  if(err) console.error(err)
});
