# coffee search-server.coffee

http = require "http"

fetchPage = (host, port, path, callback) ->  # Web リソースを取得する
  options =
    host: host
    port: port
    path: path
  req = http.get options, (res) ->
    contents = ""
    res.on 'data', (chunk) ->
      contents += "#{chunk}"   # チャンクを contents に追加
    res.on 'end', () ->
      callback(contents)
  req.on "error", (e) ->
    console.log "Erorr: {e.message}"

googleSearch = (keyword, callback) ->  # Googleの検索関数↑
  host = "ajax.googleapis.com"
  path = "/ajax/services/search/web?v=1.0&q=#{encodeURI(keyword)}"
  fetchPage host, 80, path, callback

twitterSearch = (keyword, callback) -> #Twitterの検索関数↑
  host = "search.twitter.com"
  path = "/search.json?q=#{encodeURI(keyword)}"
  fetchPage host, 80, path, callback

combinedSearch = (keyword, callback) ->  # 複合検索を実行するための関数↑
  data =
    google : ""
    twitter : ""
  googleSearch keyword, (contents) ->
    contents = JSON.parse contents   # JSON.parse 関数によって構文解析
    data.google = contents.responseData.results   # data.google フィールドの値が設定
    if data.twitter != ""   # 両方からのデータがあることを確認
      callback(data)
  twitterSearch keyword, (contents) ->
    contents = JSON.parse contents
    data.twitter = contents.results
    if data.google != ""    # 両方からのデータがあることを確認
      callback(data)

path = require "path"
fs = require "fs"
serveStatic = (uri, response) ->
  fileName = path.join process.cwd(), uri   # ファイルの相対パスを絶対パスに変換
  path.exists fileName, (exists) ->
    if not exists
      response.writeHead 404, 'Content-Type': 'text/plain'
      response.end "404 Not Found #{uri}!\n"
      return
    fs.readFile fileName, "binary", (err,file) ->
      if err
        response.writeHead 500, 'Content-Type': 'text/plain'
        response.end "Error #{uri}: #{err} \n"
        return
      response.writeHead 200
      response.write file, "binary"
      response.end()

doSearch = (uri, response) ->  # URL のクエリー・ストリングを構文解析(テンプレートになるね。)
  query = uri.query.split "&"
  params = {}
  query.forEach (nv) ->
    nvp = nv.split "="   # サブストリングのそれぞれを等号のところで分割する
    params[nvp[0]] = nvp[1]  # これらのペアのそれぞれを params オブジェクトに格納
  keyword = params["q"]
  combinedSearch keyword, (results) ->
    response.writeHead 200, 'Content-Type': 'text/plain'
    response.end JSON.stringify results
    # combinedSearch 関数に渡します

url = require "url"   # node.js webServer立ちあげ(url モジュール)
server = http.createServer (request, response) ->
  uri = url.parse(request.url)
  if uri.pathname is "/doSearch"
    doSearch uri, response
  else
    serveStatic uri.pathname, response
server.listen 8080
console.log "Server running at http://127.0.0.1:8080"