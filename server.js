const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
require("dotenv").config();
require("./database/conn.js");
const Login = require("./models/login");
const jwt = require("jsonwebtoken");

//const jwtSecret = process.env.JWT_SECRET;
const jwtSecret = "FBHWERBFUHEWRBFHWEURFE";

function auth(req, res, next) {
    const authToken = req.headers["authorization"];
    console.log(`Seu Token: ${authToken}`);
    if (authToken != undefined) {
        const BearerToken = authToken.split(" ");
        const token = BearerToken[1];
        console.log("Token extraído:", token);
        jwt.verify(token, jwtSecret, (error, data) => {
            if (error) {
                res.status(401).json({
                    infoError: `Token está Inválido! devido ao error: ${error}`,
                });
            } else {
                req.token = token;
                req.userLogger = { id: data.id, email: data.email };
                //res.status(200).json({ infoData: data });
                next();
            }
        });
    } else {
        res.status(401).json({ error: "Token Inválido" });
    }
}

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", auth, (req, res) => {
    const token = req.token;
    res.render("Home", { token });
});

app.get("/register", (req, res) => {
    res.render("Register");
});
app.post("/register/save", async (req, res) => {
    const { email, password } = req.body;

    const emailExist = await Login.findOne({
        where: {
            email: email,
        },
    });

    if (emailExist) {
        const aviso = `O email ${email} já foi cadastrado!`;
        res.status();
        res.redirect("/register");
    } else {
        if (email && password) {
            try {
                const salt = bcrypt.genSaltSync(16);
                const hash = bcrypt.hashSync(password, salt);
                const createLogin = await Login.create({
                    email: email,
                    password: hash,
                });
                createLogin.save();
                res.status(201);
                res.redirect("/");
            } catch (error) {
                console.error(
                    `Não foi possivel cadastrar por causo do error ${error}`,
                );
            }
        }
    }
});
app.get("/login", (req, res) => {
    console.log(req.userLogger);
    res.render("Login");
});
app.post("/login/save", async (req, res) => {
    const { email, password } = req.body;
    const user = await Login.findOne({ where: { email } });

    if (user) {
        const hash = user.password; // Obtém o hash de senha do usuário do banco de dados
        const passwordMatch = bcrypt.compareSync(password, hash);

        if (passwordMatch) {
            jwt.sign(
                { id: user.id, email: user.email },
                jwtSecret,
                { expiresIn: "48h" },
                (error, token) => {
                    if (error) {
                        res.status(400).json({ error: "Falha Interna" });
                    } else {
                        res.status(200).json({ token: token });
                    }
                },
            );
        } else {
            console.log("Senha incorreta. Não foi possível fazer Login");
            res.status(401);
        }
    } else {
        console.log("Email não encontrado. Não foi possível fazer Login");
        res.status(401);
    }
});
/*app.post("/auth", async (req, res) => {
    let { email, password } = req.body;
    if (email != undefined) {
        let user = await Login.findOne({
            where: {
                email: email,
            },
        });
        if (user != undefined) {
            const hash = user.password; // Obtém o hash de senha do usuário do banco de dados
            const passwordMatch = bcrypt.compareSync(password, hash);
            if (passwordMatch) {
                jwt.sign(
                    { id: user.id, email: user.email },
                    jwtSecret,
                    { expiresIn: "48h" },
                    (error, token) => {
                        if (error) {
                            res.status(400).json({ error: "Falha Interna" });
                        } else {
                            res.status(200).json({ token: token });
                        }
                    },
                );
            } else {
                res.status(401).json({ error: "Credências Inválidas" });
            }
        } else {
            res.status(404).json({
                error: "O email enviado não existe na base de dados",
            });
        }
    } else {
        res.status(403).json({ error: "Email enviado é Inválido!" });
    }
});*/
app.get("*", (__, res) => {
    res.status(404);
    res.send("Página Vázia");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
