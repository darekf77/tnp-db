// @LAST
// if (!global['ENV']) {
//   global['ENV'] = {};
// }
// const config = global['ENV'].config as any;

// import { DbDaemonController } from './deamon-controller';
// import { TnpDB } from '../wrapper-db.backend';
// import { Log } from 'ng2-logger';
// import { Morphi } from 'morphi';
// import { Models } from 'tnp-models';
// declare var ENV: Models.env.EnvConfig;


// const log = Log.create('app start')

// const Controllers = [DbDaemonController];


// export async function start(port: number = 4000) {
//   // console.log(port);
//   // process.exit(0)
//   //#region @backend
//   const db = await TnpDB.Instance(config.dbLocation);
//   port = await db.getDaemonPort();
//   //#endregion
//   //#region @backend
//   const {
//     app
//   } =
//     //#endregion
//     await Morphi.init({
//       //#region @backend
//       config: {
//         "database": "tmp/db-for-background-daemon.sqlite3",
//         "type": "sqlite",
//         "synchronize": true,
//         "dropSchema": true,
//         "logging": false
//       } as any,
//       //#endregion
//       host: `http://localhost:${port}`,
//       controllers: Controllers
//     })
//   //#region @backend
//   app.get('/', (req, res) => {
//     res.send(`<iframe src="http://localhost:9000" style="border: 0; width: 100%; height: 100%" frameborder="0" >Your browser doesn't support iFrames.</iframe>`)
//     // res.render(`<iframe src="http://localhost:9000" style="border: 0; width: 100%; height: 100%">Your browser doesn't support iFrames.</iframe>`)
//   });
//   //#endregion


//   if (Morphi.IsBrowser) {
//     let test = new DbDaemonController()
//     console.log(await test.hello().received);
//     console.log(await test.allprojects().received);

//     const body = document.firstElementChild;
//     body.innerHTML = `<h1>Hello: ${ENV.name}</h1>`;
//     console.log(ENV)
//   }
// }

// export default start;

