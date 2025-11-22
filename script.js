/* --- SELETOREs DE ELEMENTOS DOM (CACHE) ---
 * Armazenar seletores em constantes no início do script é uma boa prática.
 * Isso evita múltiplas buscas desnecessárias no DOM, melhorando a performance. */
const cardContainer = document.querySelector(".card-container");
const inputBusca = document.getElementById("input-busca");
const botaoBusca = document.querySelector("#botao-busca");
const btnTopo = document.getElementById("btn-topo");
const btnFinal = document.getElementById("btn-final");
const btnLimpar = document.getElementById("btn-limpar");
const loadingSpinner = document.getElementById("loading-spinner");
const filtrosContainer = document.querySelector(".filtros-container");
// Seletores dos Modais
const modalOverlay = document.getElementById("modal-overlay");
const modalSkinsOverlay = document.getElementById("modal-skins-overlay");
const skinsGallery = document.getElementById("skins-gallery-container");

/* --- CONSTANTES E VARIÁVEIS GLOBAIS ---
 * Centralizar URLs e valores fixos facilita a manutenção. */
const VERSION_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const BASE_IMG_URL =
  "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/";

const TRADUCAO_TAGS = {
  Assassin: "Assassino",
  Fighter: "Lutador",
  Mage: "Mago",
  Marksman: "Atirador",
  Support: "Suporte",
  Tank: "Tanque",
};

// Variável para armazenar todos os campeões após o fetch inicial. Funciona como um cache local.
let todosCampeoes = [];
// Variável para manter a instância do gráfico e poder destruí-la antes de criar uma nova.
let meuGrafico = null;
// Armazena a versão mais recente da API para ser usada em todas as chamadas subsequentes.
let versaoAtual = "";

/* --- INICIALIZAÇÃO DA APLICAÇÃO ---
 * A função window.onload garante que o script só será executado após o carregamento completo da página.
 * O uso de 'async/await' torna o código assíncrono mais legível e fácil de gerenciar. */
window.onload = async () => {
  try {
    // Exibe o spinner de carregamento para dar feedback visual ao usuário.
    if (loadingSpinner) loadingSpinner.style.display = "flex";
    cardContainer.innerHTML = "";

    // 1. Busca a versão mais recente do patch da API da Riot.
    const respostaVersoes = await fetch(VERSION_URL);
    const versoes = await respostaVersoes.json();
    versaoAtual = versoes[0];

    // Atualiza a UI com o número do patch atual.
    document.getElementById("numero-versao").innerText = versaoAtual;
    console.log(`Patch atual: ${versaoAtual}`);

    const API_URL = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/data/pt_BR/champion.json`;
    const respostaCampeoes = await fetch(API_URL);
    const dadosJson = await respostaCampeoes.json();

    // Transforma o objeto de campeões em um array e armazena no "cache" local.
    todosCampeoes = Object.values(dadosJson.data);

    // Esconde o spinner e renderiza os cards dos campeões.
    if (loadingSpinner) loadingSpinner.style.display = "none";
    renderizarCards(todosCampeoes);
  } catch (erro) {
    // Tratamento de erro robusto: informa o usuário sobre a falha e loga o erro no console.
    console.error("Erro Fatal:", erro);
    if (loadingSpinner) loadingSpinner.style.display = "none";
    cardContainer.innerHTML =
      "<p style='color: red; text-align: center;'>Falha ao conectar com a Riot Games.</p>";
  }
};

/* --- LÓGICA DE BUSCA E FILTRAGEM ---
 * A função 'iniciarBusca' filtra a lista 'todosCampeoes' com base no termo digitado.
 * Ela verifica nome, título e tags traduzidas, tornando a busca mais abrangente. */
async function iniciarBusca() {
  // Normaliza o termo de busca para minúsculas e remove espaços em branco.
  const termoBusca = inputBusca.value.toLowerCase().trim();

  if (termoBusca === "") {
    renderizarCards(todosCampeoes);
    return;
  }

  // Filtra o array de campeões. A lógica inclui a tradução das tags para a busca funcionar em português.
  const dadosFiltrados = todosCampeoes.filter((campeao) => {
    const tagsTraduzidas = campeao.tags.map((tag) =>
      TRADUCAO_TAGS[tag].toLowerCase()
    );
    return (
      campeao.name.toLowerCase().includes(termoBusca) ||
      campeao.title.toLowerCase().includes(termoBusca) ||
      tagsTraduzidas.some((tag) => tag.includes(termoBusca))
    );
  });

  // Se nenhum campeão for encontrado, exibe uma mensagem amigável.
  if (dadosFiltrados.length === 0) {
    cardContainer.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
                <i class="ph ph-smiley-sad" style="font-size: 5rem; color: #5b5a56; margin-bottom: 1rem;"></i>
                <p style="color: #f0e6d2; font-size: 1.5rem; margin-bottom: 0.5rem;">Ops! Nenhum campeão encontrado.</p>
            </div>
        `;
    return;
  }
  renderizarCards(dadosFiltrados);
}

// O evento 'input' oferece uma experiência de busca em tempo real.
inputBusca.addEventListener("input", () => {
  if (inputBusca.value.trim().length > 0) btnLimpar.style.display = "block";
  else btnLimpar.style.display = "none";
  iniciarBusca();
});

// Limpa o campo de busca e restaura a lista completa de campeões.
btnLimpar.addEventListener("click", () => {
  inputBusca.value = "";
  btnLimpar.style.display = "none";
  inputBusca.focus();
  renderizarCards(todosCampeoes);
});

/* --- RENDERIZAÇÃO DOS CARDS ---
 * Esta função é responsável por gerar o HTML de cada card de campeão e inseri-lo no contêiner.
 * É uma função "pura" no sentido de que sua saída depende apenas de sua entrada (a lista). */
function renderizarCards(lista) {
  cardContainer.innerHTML = "";
  lista.forEach((campeao, index) => {
    let article = document.createElement("article");
    article.classList.add("card");
    // Adiciona o ID do campeão ao dataset para fácil acesso posterior nos eventos de clique.
    article.dataset.id = campeao.id;

    // Adiciona um pequeno delay na animação dos primeiros cards para um efeito de entrada suave.
    if (index < 15) article.style.animationDelay = `${index * 0.05}s`;
    else article.style.animationDelay = `0s`;

    const imgUrl = `${BASE_IMG_URL}${campeao.id}_0.jpg`;

    article.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${imgUrl}" alt="${
      campeao.name
    }" width="308" height="560" loading="lazy"> <!-- 'loading="lazy"' melhora a performance inicial da página. -->
            </div>
            <div class="card-content">
                <h2>${campeao.name}</h2>
                <p class="titulo">${campeao.title}</p>
                <p class="descricao">${campeao.blurb}</p>
                <div class="tags">
                    ${campeao.tags
                      .map((tag) => `<span>${TRADUCAO_TAGS[tag] || tag}</span>`)
                      .join("")}
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button class="btn-skins">
                        <i class="ph-fill ph-paint-brush-broad"></i> Skins
                    </button>
                </div>
                <button class="btn-detalhes">Ver Detalhes</button>
            </div>
        `;
    cardContainer.appendChild(article);
  });
}

/* --- FUNÇÕES DE CONTROLE DOS MODAIS ---
 * Funções simples e diretas para abrir e fechar os modais, controlando a visibilidade e o scroll da página. */
function fecharModal() {
  modalOverlay.classList.add("hidden");
  document.body.style.overflow = "auto";
}

function fecharModalSkins() {
  modalSkinsOverlay.classList.add("hidden");
  document.body.style.overflow = "auto";
}

/* --- LÓGICA PARA ABRIR MODAL DE SKINS ---
 * Busca os dados detalhados de um campeão específico para obter a lista de skins.
 * Constrói dinamicamente a galeria de skins. */
async function abrirModalSkins(campeaoId) {
  const modal = document.getElementById("modal-skins-overlay");
  const modalContent = modal.querySelector(".modal-skins-content");
  const containerGaleria = document.getElementById("skins-gallery-container");
  const tituloModal = document.getElementById("skins-campeao-nome");

  containerGaleria.innerHTML =
    "<p style='color:white;'>Carregando visuais...</p>";
  tituloModal.innerText = campeaoId;
  // Define a splash art da skin padrão como fundo do modal para um efeito temático.
  modalContent.style.backgroundImage = `linear-gradient(to bottom, rgba(9, 20, 40, 0.3), rgba(9, 20, 40, 0.9)), url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${campeaoId}_0.jpg')`;
  document.getElementById("skins-gallery-container").scrollLeft = 0;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // O fetch é feito "on-demand", apenas quando o usuário solicita, economizando dados.
  try {
    const urlDetalhada = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/data/pt_BR/champion/${campeaoId}.json`;
    const resposta = await fetch(urlDetalhada);
    const dados = await resposta.json();
    const skins = dados.data[campeaoId].skins;

    const skinsHtml = skins
      .map((skin) => {
        const imgUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${campeaoId}_${skin.num}.jpg`;
        const nomeSkin = skin.name === "default" ? "Padrão" : skin.name;
        return `
                <div class="skin-card">
                    <img src="${imgUrl}" alt="${nomeSkin}" width="308" height="560" loading="lazy">
                    <p>${nomeSkin}</p>
                </div>
            `;
      })
      .join("");

    containerGaleria.innerHTML = skinsHtml;
  } catch (erro) {
    console.error(erro);
    containerGaleria.innerHTML =
      "<p style='color:red;'>Erro ao carregar skins.</p>";
  }
}

/* --- LÓGICA PARA ABRIR MODAL DE DETALHES ---
 * Função mais complexa que:
 * 1. Popula o modal com dados básicos já disponíveis (nome, título).
 * 2. Busca dados detalhados (lore, habilidades, dicas) de forma assíncrona.
 * 3. Renderiza o gráfico de poder usando Chart.js.
 * 4. Constrói a seção de habilidades e dicas. */
async function abrirModal(campeaoId) {
  const campeao = todosCampeoes.find((c) => c.id === campeaoId);
  if (!campeao) return;

  // Seleciona os elementos do modal para preenchimento.
  const modal = document.getElementById("modal-overlay");
  const img = document.getElementById("modal-img");
  const nome = document.getElementById("modal-nome");
  const titulo = document.getElementById("modal-titulo");
  const desc = document.getElementById("modal-descricao");
  const statsBox = document.querySelector(".stats-box");
  const spellsContainer = document.getElementById("spells-container");

  // Reseta o estado do modal antes de exibir.
  modal.querySelector(".modal-content").scrollTop = 0;
  nome.innerText = campeao.name;
  titulo.innerText = campeao.title;
  img.src = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${campeao.id}_0.jpg`;
  desc.innerText = "Buscando arquivos...";
  if (spellsContainer)
    spellsContainer.innerHTML =
      "<p style='color: #a0a0a0'>Carregando habilidades...</p>";

  // Limpa as listas de dicas antes de preenchê-las.
  const allyList = document.getElementById("ally-tips-list");
  const enemyList = document.getElementById("enemy-tips-list");
  if (allyList) allyList.innerHTML = "";
  if (enemyList) enemyList.innerHTML = "";

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Lógica para renderizar o gráfico de poder.
  const info = campeao.info;
  const temStats =
    info.attack > 0 ||
    info.defense > 0 ||
    info.magic > 0 ||
    info.difficulty > 0;

  if (temStats) {
    statsBox.style.display = "block";
    // Destrói a instância anterior do gráfico para evitar sobreposição e memory leaks.
    if (meuGrafico) meuGrafico.destroy();
    // Usa um setTimeout para garantir que a animação do modal não conflite com a renderização do canvas.
    setTimeout(() => {
      const ctx = document.getElementById("graficoPoder").getContext("2d");
      meuGrafico = new Chart(ctx, {
        type: "radar",
        data: {
          labels: ["Ataque", "Defesa", "Magia", "Dificuldade"],
          datasets: [
            {
              label: "Nível de Poder",
              data: [info.attack, info.defense, info.magic, info.difficulty],
              backgroundColor: "rgba(200, 155, 60, 0.2)",
              borderColor: "#c89b3c",
              pointBackgroundColor: "#f0e6d2",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "#c89b3c",
              borderWidth: 2,
            },
          ],
        },
        options: {
          animation: { duration: 1500, easing: "easeOutQuart" },
          scales: {
            r: {
              angleLines: { color: "rgba(91, 90, 86, 0.3)" },
              grid: { color: "rgba(91, 90, 86, 0.3)" },
              pointLabels: {
                color: "#c89b3c",
                font: { size: 14, family: "'Quicksand', sans-serif" },
              },
              ticks: { display: false, maxTicksLimit: 5 },
              suggestedMin: 0,
              suggestedMax: 10,
            },
          },
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
        },
      });
    }, 300);
  } else {
    statsBox.style.display = "none";
  }

  // Busca e preenche as informações detalhadas (lore, habilidades, etc.).
  try {
    const urlDetalhada = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/data/pt_BR/champion/${campeaoId}.json`;
    const resposta = await fetch(urlDetalhada);
    const dadosJson = await resposta.json();
    const dadosDetalhados = dadosJson.data[campeaoId];
    desc.innerText = dadosDetalhados.lore;

    // Constrói dinamicamente os cards de habilidades (passiva + Q,W,E,R).
    if (spellsContainer) {
      spellsContainer.innerHTML = "";
      const passiva = dadosDetalhados.passive;
      const imgPassiva = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/img/passive/${passiva.image.full}`;
      const passivaHtml = `
                <div class="spell-card">
                    <div class="spell-img-wrapper">
                        <img src="${imgPassiva}" alt="${passiva.name}" width="64" height="64">
                        <span class="spell-key">P</span>
                    </div>
                    <div class="spell-info">
                        <h4>${passiva.name}</h4>
                        <p>${passiva.description}</p>
                    </div>
                </div>`;

      const teclas = ["Q", "W", "E", "R"];
      const spellsHtml = dadosDetalhados.spells
        .map((spell, index) => {
          const imgSpell = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/img/spell/${spell.image.full}`;
          return `
                    <div class="spell-card">
                        <div class="spell-img-wrapper">
                            <img src="${imgSpell}" alt="${spell.name}" width="64" height="64">
                            <span class="spell-key">${teclas[index]}</span>
                        </div>
                        <div class="spell-info">
                            <h4>${spell.name}</h4>
                            <p>${spell.description}</p>
                        </div>
                    </div>`;
        })
        .join("");
      spellsContainer.innerHTML = passivaHtml + spellsHtml;
    }

    // Preenche as listas de dicas de "Jogando com" e "Jogando contra".
    if (dadosDetalhados.allytips && dadosDetalhados.allytips.length > 0) {
      dadosDetalhados.allytips.forEach((tip) => {
        const li = document.createElement("li");
        li.innerText = tip;
        if (allyList) allyList.appendChild(li);
      });
    } else if (allyList) {
      allyList.innerHTML =
        "<li style='list-style: none'>Sem dicas disponíveis.</li>";
    }

    if (dadosDetalhados.enemytips && dadosDetalhados.enemytips.length > 0) {
      dadosDetalhados.enemytips.forEach((tip) => {
        const li = document.createElement("li");
        li.innerText = tip;
        if (enemyList) enemyList.appendChild(li);
      });
    } else if (enemyList) {
      enemyList.innerHTML =
        "<li style='list-style: none'>Sem dicas disponíveis.</li>";
    }

    // Gera os links dinâmicos para sites de builds, tratando o nome do campeão para o formato da URL.
    const cleanId = campeaoId.toLowerCase().replace(/['\s.]/g, "");
    const linkUgg = document.getElementById("link-ugg");
    const linkOpgg = document.getElementById("link-opgg");
    if (linkUgg) linkUgg.href = `https://u.gg/lol/champions/${cleanId}/build`;
    if (linkOpgg)
      linkOpgg.href = `https://www.op.gg/champions/${cleanId}/build`;
  } catch (erro) {
    console.error(erro);
    desc.innerText = campeao.blurb;
    if (spellsContainer)
      spellsContainer.innerHTML = "<p style='color:red'>Info indisponível.</p>";
  }
}

/* --- EVENT LISTENERS GERAIS --- */
botaoBusca.addEventListener("click", iniciarBusca);
btnTopo.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);
btnFinal.addEventListener("click", () =>
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
);
// Permite rolar a galeria de skins horizontalmente com o scroll do mouse.
skinsGallery.addEventListener("wheel", (evt) => {
  if (!modalSkinsOverlay.classList.contains("hidden")) {
    evt.preventDefault();
    skinsGallery.scrollLeft += evt.deltaY * 4;
  }
});

/* --- DELEGAÇÃO DE EVENTOS (EVENT DELEGATION) ---
 * Em vez de adicionar um listener para cada botão, adicionamos um único listener ao contêiner pai.
 * Isso melhora a performance e funciona automaticamente para elementos adicionados dinamicamente.
 * É uma das práticas mais importantes em manipulação de eventos no DOM. */

// Listener para os botões de filtro de classe.
filtrosContainer.addEventListener("click", (event) => {
  // Verifica se o clique foi realmente em um botão de filtro.
  const elementoBotao = event.target.closest(".btn-filtro");
  if (!elementoBotao) return;
  filtrosContainer.querySelector(".ativo").classList.remove("ativo");
  elementoBotao.classList.add("ativo");
  const tag = elementoBotao.dataset.tag;
  // Filtra e renderiza os campeões com base na tag selecionada.
  if (tag === "Todos") {
    renderizarCards(todosCampeoes);
    return;
  }
  const dadosFiltrados = todosCampeoes.filter((campeao) =>
    campeao.tags.includes(tag)
  );
  if (dadosFiltrados.length === 0) {
    cardContainer.innerHTML = `<p style='color: white; text-align: center; grid-column: 1/-1;'>Nenhum campeão encontrado nesta categoria.</p>`;
  } else {
    renderizarCards(dadosFiltrados);
  }
});

// Listener para os cliques nos cards (abrir modal de detalhes ou de skins).
cardContainer.addEventListener("click", (event) => {
  const target = event.target;
  const card = target.closest(".card");
  const campeaoId = card?.dataset.id;
  if (!campeaoId) return;
  if (target.closest(".btn-detalhes")) {
    abrirModal(campeaoId);
  } else if (target.closest(".btn-skins")) {
    abrirModalSkins(campeaoId);
  }
});

/* --- LISTENERS PARA FECHAR MODAIS --- */
modalOverlay.addEventListener("click", fecharModal);
modalSkinsOverlay.addEventListener("click", fecharModalSkins);
modalOverlay
  .querySelector(".btn-fechar")
  .addEventListener("click", fecharModal);
modalSkinsOverlay
  .querySelector(".btn-fechar")
  .addEventListener("click", fecharModalSkins);

// Impede que o modal feche ao clicar dentro do seu conteúdo (propagação de evento).
modalOverlay
  .querySelector(".modal-content")
  .addEventListener("click", (e) => e.stopPropagation());
modalSkinsOverlay
  .querySelector(".modal-skins-content")
  .addEventListener("click", (e) => e.stopPropagation());

// Adiciona um listener global para fechar os modais com a tecla 'Escape' (melhora a acessibilidade e UX).
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    // Verifica qual modal está aberto para fechar o correto.
    if (!modalOverlay.classList.contains("hidden")) fecharModal();
    if (!modalSkinsOverlay.classList.contains("hidden")) fecharModalSkins();
  }
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    btnTopo.style.opacity = "1";
    btnTopo.style.pointerEvents = "auto";
  } else {
    btnTopo.style.opacity = "0";
    btnTopo.style.pointerEvents = "none";
  }
});
