const loginAdmin = document.getElementById("loginAdmin");

const painelAdmin = document.getElementById("painelAdmin");

const senhaAdmin = document.getElementById("senhaAdmin");

const entrarAdmin = document.getElementById("entrarAdmin");

const mensagemLogin = document.getElementById("mensagemLogin");

const atualizarResultados = document.getElementById(
  "atualizarResultados"
);

const listaVotos = document.getElementById("listaVotos");

const buscarApartamento = document.getElementById(
  "buscarApartamento"
);

let senhaAtual = "";

let votosCarregados = [];

entrarAdmin.addEventListener("click", fazerLogin);

senhaAdmin.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    fazerLogin();
  }
});

async function fazerLogin() {
  const senha = senhaAdmin.value;

  if (!senha) {
    mensagemLogin.textContent = "Digite a senha.";

    mensagemLogin.className = "mensagem erro";

    return;
  }

  try {
    const resposta = await fetch("/api/admin/login", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        senha,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.mensagem);
    }

    senhaAtual = senha;

    senhaAdmin.value = "";

    loginAdmin.classList.add("escondido");

    painelAdmin.classList.remove("escondido");

    await carregarTudo();
  } catch (error) {
    mensagemLogin.textContent = error.message;

    mensagemLogin.className = "mensagem erro";
  }
}

async function carregarTudo() {
  await Promise.all([
    carregarResultados(),
    carregarVotos(),
  ]);
}

async function carregarResultados() {
  const resposta = await fetch(
    "/api/admin/resultados",
    {
      headers: {
        "x-admin-password": senhaAtual,
      },
    }
  );

  if (resposta.status === 401) {
    voltarLogin();

    return;
  }

  const dados = await resposta.json();

  document.getElementById("totalVotos").textContent =
    dados.total;

  document.getElementById("totalSim").textContent =
    dados.sim;

  document.getElementById("totalNao").textContent =
    dados.nao;

  document.getElementById("percentualSim").textContent =
    `${dados.percentualSim}%`;

  document.getElementById("percentualNao").textContent =
    `${dados.percentualNao}%`;
}

async function carregarVotos() {
  const resposta = await fetch(
    "/api/admin/votos",
    {
      headers: {
        "x-admin-password": senhaAtual,
      },
    }
  );

  if (resposta.status === 401) {
    voltarLogin();

    return;
  }

  votosCarregados = await resposta.json();

  mostrarVotos(votosCarregados);
}

function mostrarVotos(votos) {
  listaVotos.innerHTML = "";

  if (votos.length === 0) {
    listaVotos.innerHTML = `
      <tr>
        <td colspan="4" class="sem-votos">
          Nenhum voto registrado.
        </td>
      </tr>
    `;

    return;
  }

  votos.forEach((registro) => {
    const linha = document.createElement("tr");

    const data = new Date(
      registro.criado_em
    ).toLocaleString("pt-BR");

    const classeVoto =
      registro.voto === "SIM"
        ? "voto-sim"
        : "voto-nao";

    linha.innerHTML = `
      <td>${escaparHTML(registro.nome)}</td>

      <td>
        ${escaparHTML(registro.apartamento)}
      </td>

      <td>
        <span class="${classeVoto}">
          ${
            registro.voto === "SIM"
              ? "✓ SIM"
              : "✕ NÃO"
          }
        </span>
      </td>

      <td>${data}</td>
    `;

    listaVotos.appendChild(linha);
  });
}

buscarApartamento.addEventListener(
  "input",
  () => {
    const termo = buscarApartamento
      .value
      .trim()
      .toLowerCase();

    const filtrados = votosCarregados.filter(
      (registro) => {
        return (
          registro.apartamento
            .toLowerCase()
            .includes(termo) ||
          registro.nome
            .toLowerCase()
            .includes(termo)
        );
      }
    );

    mostrarVotos(filtrados);
  }
);

atualizarResultados.addEventListener(
  "click",
  carregarTudo
);

function voltarLogin() {
  senhaAtual = "";

  painelAdmin.classList.add("escondido");

  loginAdmin.classList.remove("escondido");

  mensagemLogin.textContent =
    "Sua sessão expirou. Entre novamente.";

  mensagemLogin.className =
    "mensagem erro";
}

function escaparHTML(valor) {
  const div = document.createElement("div");

  div.textContent = valor;

  return div.innerHTML;
}