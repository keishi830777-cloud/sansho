import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const files=new Map([['/sansho/','index.html'],['/sansho/ogp.png','ogp.png'],['/sansho/one-shot/','one-shot/index.html'],['/sansho/one-shot/index.html','one-shot/index.html'],['/sansho/one-shot/ogp.png','one-shot/ogp.png']]);
createServer(async(req,res)=>{try{const file=files.get(new URL(req.url,'http://local').pathname);if(!file){res.writeHead(404);res.end();return;}const data=await readFile(`.pages/${file}`);res.writeHead(200,{'Content-Type':file.endsWith('.png')?'image/png':'text/html; charset=utf-8'});res.end(data);}catch{res.writeHead(500);res.end();}}).listen(Number(process.env.PORT)||4190,'127.0.0.1',()=>process.stdout.write('Pages artifact server ready\n'));
