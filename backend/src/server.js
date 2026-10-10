"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_js_1 = __importDefault(require("./app.js"));
const database_js_1 = require("./config/database.js");
// PORT DU SERVEUR
const PORT = Number(process.env.PORT || 3000);
// DEMARRAGE DU SERVEUR
async function startServer() {
    try {
        await (0, database_js_1.testDatabaseConnection)();
        app_js_1.default.listen(PORT, () => {
            console.log(`WeightAty API : http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Impossible de se connecter à PostgreSQL :', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map