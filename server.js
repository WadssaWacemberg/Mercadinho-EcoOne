require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));



app.get("/api/status", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");

    res.json({
      online: true,
      mensagem: "Servidor e banco conectados.",
    });
  } catch (error) {
    console.error("Erro na conexão:", error);

    res.status(500).json({
      online: false,
      mensagem: "Erro ao conectar ao banco.",
    });
  }
});



app.post("/api/votos", async (req, res) => {
  try {
    let { nome, apartamento, voto } = req.body;


    nome = String(nome || "")
      .trim()
      .replace(/\s+/g, " ");

    apartamento = String(apartamento || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    voto = String(voto || "")
      .trim()
      .toUpperCase();


    if (!nome || !apartamento || !voto) {
      return res.status(400).json({
        mensagem: "Preencha nome, apartamento e voto.",
      });
    }

   

    const partesNome = nome
      .split(" ")
      .filter(Boolean);

    if (partesNome.length < 2) {
      return res.status(400).json({
        mensagem: "Informe seu nome e sobrenome.",
      });
    }


    if (nome.length < 5 || nome.length > 150) {
      return res.status(400).json({
        mensagem: "Informe um nome válido.",
      });
    }


    const apartamentoValido = /^\d+[AB]$/.test(apartamento);

    if (!apartamentoValido) {
      return res.status(400).json({
        mensagem:
          "Informe o número do apartamento seguido do bloco A ou B. Exemplo: 23A ou 23B.",
      });
    }

   

    if (!["SIM", "NAO"].includes(voto)) {
      return res.status(400).json({
        mensagem: "Voto inválido.",
      });
    }

    const resultado = await pool.query(
      `
        INSERT INTO votos (
          nome,
          apartamento,
          voto
        )
        VALUES ($1, $2, $3)

        RETURNING
          id,
          nome,
          apartamento,
          voto,
          criado_em
      `,
      [nome, apartamento, voto]
    );

    return res.status(201).json({
      mensagem: "Voto registrado com sucesso!",
      voto: resultado.rows[0],
    });

  } catch (error) {

   
    if (error.code === "23505") {
      return res.status(409).json({
        mensagem:
          "Este apartamento já participou da votação.",
      });
    }

    console.error(
      "Erro ao registrar voto:",
      error
    );

    return res.status(500).json({
      mensagem:
        "Não foi possível registrar o voto.",
    });
  }
});


app.post("/api/admin/login", (req, res) => {
  const senha = String(
    req.body.senha || ""
  );

  if (!senha) {
    return res.status(400).json({
      mensagem: "Informe a senha.",
    });
  }

  if (senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      mensagem: "Senha incorreta.",
    });
  }

  return res.json({
    sucesso: true,
    mensagem: "Acesso autorizado.",
  });
});



function verificarAdmin(req, res, next) {
  const senha =
    req.headers["x-admin-password"];

  if (
    !senha ||
    senha !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      mensagem: "Acesso não autorizado.",
    });
  }

  next();
}



app.get(
  "/api/admin/resultados",
  verificarAdmin,
  async (req, res) => {
    try {
      const contagem =
        await pool.query(`
          SELECT
            voto,
            COUNT(*)::int AS total
          FROM votos
          GROUP BY voto
        `);

      let sim = 0;
      let nao = 0;

      contagem.rows.forEach(
        (linha) => {
          if (linha.voto === "SIM") {
            sim = linha.total;
          }

          if (linha.voto === "NAO") {
            nao = linha.total;
          }
        }
      );

      const total = sim + nao;

      const percentualSim =
        total === 0
          ? 0
          : Number(
              (
                (sim / total) *
                100
              ).toFixed(1)
            );

      const percentualNao =
        total === 0
          ? 0
          : Number(
              (
                (nao / total) *
                100
              ).toFixed(1)
            );

      return res.json({
        total,
        sim,
        nao,
        percentualSim,
        percentualNao,
      });

    } catch (error) {
      console.error(
        "Erro ao consultar resultados:",
        error
      );

      return res.status(500).json({
        mensagem:
          "Erro ao carregar resultados.",
      });
    }
  }
);


app.get(
  "/api/admin/votos",
  verificarAdmin,
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            id,
            nome,
            apartamento,
            voto,
            criado_em
          FROM votos
          ORDER BY criado_em DESC
        `);

      return res.json(
        resultado.rows
      );

    } catch (error) {
      console.error(
        "Erro ao carregar votos:",
        error
      );

      return res.status(500).json({
        mensagem:
          "Erro ao carregar os votos.",
      });
    }
  }
);



app.listen(PORT, () => {
  console.log(
    `Servidor rodando em http://localhost:${PORT}`
  );
});