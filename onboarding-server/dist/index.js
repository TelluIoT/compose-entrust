"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3000;
// Middleware to parse JSON
app.use(express_1.default.json());
app.get('/getCredentials', (req, res) => {
    const param = req.query.param;
    if (!param) {
        return res.status(400).send('Missing parameter');
    }
    res.send(param);
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
