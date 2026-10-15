// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  /**
   * URL de base de l'API REST Weight'Aty.
   *
   * En développement, on utilise un chemin RELATIF : les appels `/api/...` sont
   * relayés vers le backend par le proxy du serveur de dev (voir
   * `mobile/proxy.conf.json`). Il n'y a donc qu'une seule adresse à retenir,
   * celle de l'app (`ionic serve`), aussi bien depuis le PC que depuis un
   * téléphone sur le même Wi-Fi.
   */
  apiUrl: '/api'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
