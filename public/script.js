const form = document.getElementById("formVoto");
const botoesVoto = document.querySelectorAll(".botao-voto");
const campoVoto = document.getElementById("voto");
const mensagem = document.getElementById("mensagem");
const confirmar = document.getElementById("confirmarVoto");

const paginaVotacao = document.getElementById("paginaVotacao");
const paginaObrigado = document.getElementById("paginaObrigado");
const apartamentoConfirmado = document.getElementById(
  "apartamentoConfirmado"
);




botoesVoto.forEach((botao) => {
  botao.addEventListener("click", () => {

    botoesVoto.forEach((item) => {
      item.classList.remove("selecionado");
    });

    botao.classList.add("selecionado");

    if (campoVoto) {
      campoVoto.value = botao.dataset.voto;
    }

    if (mensagem) {
      mensagem.textContent = "";
    }

  });
});




if (form) {

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const campoNome = document.getElementById("nome");
    const campoApartamento =
      document.getElementById("apartamento");

    const nome = campoNome
      ? campoNome.value.trim()
      : "";

    const apartamento = campoApartamento
      ? campoApartamento.value
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "")
      : "";

    const voto = campoVoto
      ? campoVoto.value
      : "";


    

    const partesNome =
      nome.split(" ").filter(Boolean);

    if (partesNome.length < 2) {

      mostrarMensagem(
        "Informe seu nome e sobrenome.",
        "erro"
      );

      return;
    }


   

    if (!/^\d+[AB]$/.test(apartamento)) {

      mostrarMensagem(
        "Informe o apartamento com o bloco A ou B. Exemplo: 23A ou 23B.",
        "erro"
      );

      return;
    }


    

    if (!voto) {

      mostrarMensagem(
        "Escolha SIM ou NÃO antes de confirmar.",
        "erro"
      );

      return;
    }


    if (confirmar) {

      confirmar.disabled = true;

      confirmar.textContent =
        "Registrando seu voto...";

    }


    try {

      const resposta = await fetch("/api/votos", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          nome,
          apartamento,
          voto,
        }),

      });


      const dados = await resposta.json();


      if (!resposta.ok) {

        throw new Error(
          dados.mensagem ||
          "Não foi possível registrar o voto."
        );

      }


      

      if (apartamentoConfirmado) {

        apartamentoConfirmado.textContent =
          apartamento;

      }


      if (paginaVotacao) {

        paginaVotacao.classList.add(
          "escondido"
        );

      }


      if (paginaObrigado) {

        paginaObrigado.classList.remove(
          "escondido"
        );

      } else {

       

        alert(
          `Obrigado! Seu voto do apartamento ${apartamento} foi registrado com sucesso.`
        );

      }


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });


    } catch (error) {

      mostrarMensagem(
        error.message,
        "erro"
      );


      if (confirmar) {

        confirmar.disabled = false;

        confirmar.textContent =
          "Confirmar meu voto";

      }

    }

  });

}




function mostrarMensagem(texto, tipo) {

  if (!mensagem) {
    console.error(texto);
    return;
  }

  mensagem.textContent = texto;

  mensagem.className =
    `mensagem ${tipo}`;

}




const videoMercadinho =
  document.getElementById("videoMercadinho");

const botaoSom =
  document.getElementById("botaoSom");

const botaoIrParaVotacao =
  document.getElementById("irParaVotacao");


if (videoMercadinho && botaoSom) {

  botaoSom.addEventListener(
    "click",
    async () => {

      videoMercadinho.muted =
        !videoMercadinho.muted;


      if (videoMercadinho.muted) {

        botaoSom.textContent =
          "🔊 Ativar som";

      } else {

        botaoSom.textContent =
          "🔇 Desativar som";

        try {

          await videoMercadinho.play();

        } catch (erro) {

          console.log(
            "O navegador bloqueou a reprodução."
          );

        }

      }

    }
  );

}



if (
  botaoIrParaVotacao &&
  paginaVotacao
) {

  botaoIrParaVotacao.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      paginaVotacao.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    }
  );

}