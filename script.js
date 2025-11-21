const cardContainer = document.querySelector(".card-container");
const inputBusca = document.querySelector("input");
const botaoBusca = document.querySelector("#botao-busca");
const btnTopo = document.getElementById("btn-topo");
const btnLimpar = document.getElementById("btn-limpar");
const loadingSpinner = document.getElementById("loading-spinner");

// URLs
const VERSION_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const BASE_IMG_URL = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/";

// Dicionário de Tradução
const TRADUCAO_TAGS = {
    "Assassin": "Assassino", "Fighter": "Lutador", "Mage": "Mago",
    "Marksman": "Atirador", "Support": "Suporte", "Tank": "Tanque"
};

// Variáveis Globais
let todosCampeoes = [];
let meuGrafico = null; 
let versaoAtual = ""; 

// --- INICIALIZAÇÃO ---
window.onload = async () => {
    try {
        if (loadingSpinner) loadingSpinner.style.display = "flex";
        cardContainer.innerHTML = "";

        const respostaVersoes = await fetch(VERSION_URL);
        const versoes = await respostaVersoes.json();
        versaoAtual = versoes[0]; 
        
        document.getElementById("numero-versao").innerText = versaoAtual;
        console.log(`Patch atual detectado: ${versaoAtual}`);
        
        const API_URL = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/data/pt_BR/champion.json`;
        const respostaCampeoes = await fetch(API_URL);
        const dadosJson = await respostaCampeoes.json();
        
        todosCampeoes = Object.values(dadosJson.data);
        
        if (loadingSpinner) loadingSpinner.style.display = "none";
        renderizarCards(todosCampeoes);
        
    } catch (erro) {
        console.error("Erro Fatal:", erro);
        if (loadingSpinner) loadingSpinner.style.display = "none";
        cardContainer.innerHTML = "<p style='color: red; text-align: center;'>Falha ao conectar com a Riot Games. Verifique sua internet.</p>";
    }
};

// --- FUNÇÃO DE BUSCA (Live Search) ---
async function iniciarBusca() {
    const termoBusca = inputBusca.value.toLowerCase().trim();
    
    if (termoBusca === "") {
        renderizarCards(todosCampeoes);
        return;
    }

    const dadosFiltrados = todosCampeoes.filter((campeao) => {
        const tagsTraduzidas = campeao.tags.map(tag => TRADUCAO_TAGS[tag].toLowerCase());
        
        return campeao.name.toLowerCase().includes(termoBusca) || 
               campeao.title.toLowerCase().includes(termoBusca) ||
               tagsTraduzidas.some(tag => tag.includes(termoBusca));
    });

    if (dadosFiltrados.length === 0) {
        cardContainer.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
                <i class="ph ph-smiley-sad" style="font-size: 5rem; color: #5b5a56; margin-bottom: 1rem;"></i>
                <p style="color: #f0e6d2; font-size: 1.5rem; margin-bottom: 0.5rem;">Ops! Nenhum campeão encontrado.</p>
                <p style="color: #5b5a56;">Verifique a ortografia ou tente outra classe.</p>
            </div>
        `;
        return;
    }

    renderizarCards(dadosFiltrados);
}

inputBusca.addEventListener("input", () => {
    if (inputBusca.value.trim().length > 0) btnLimpar.style.display = "block";
    else btnLimpar.style.display = "none";
    iniciarBusca();
});

btnLimpar.addEventListener("click", () => {
    inputBusca.value = "";
    btnLimpar.style.display = "none";
    inputBusca.focus();
    renderizarCards(todosCampeoes);
});

// --- FILTRAGEM POR BOTÕES ---
function filtrarPorTag(tag, elementoBotao) {
    inputBusca.value = "";
    btnLimpar.style.display = "none";
    const botoes = document.querySelectorAll(".btn-filtro");
    botoes.forEach(btn => btn.classList.remove("ativo"));
    elementoBotao.classList.add("ativo");

    if (tag === "Todos") {
        renderizarCards(todosCampeoes);
        return;
    }

    const dadosFiltrados = todosCampeoes.filter((campeao) => campeao.tags.includes(tag));
    
    if (dadosFiltrados.length === 0) {
        cardContainer.innerHTML = `<p style='color: white; text-align: center; grid-column: 1/-1;'>Nenhum campeão encontrado nesta categoria.</p>`;
        return;
    }
    renderizarCards(dadosFiltrados);
}

// --- RENDERIZAÇÃO ---
function renderizarCards(lista) {
    cardContainer.innerHTML = ""; 

    lista.forEach((campeao, index) => {
        let article = document.createElement("article");
        article.classList.add("card");
        
        if (index < 15) article.style.animationDelay = `${index * 0.05}s`; 
        else article.style.animationDelay = `0s`; 

        const imgUrl = `${BASE_IMG_URL}${campeao.id}_0.jpg`;

        article.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${imgUrl}" alt="${campeao.name}" width="308" height="560" loading="lazy">
            </div>
            <div class="card-content">
                <h2>${campeao.name}</h2>
                <p class="titulo">${campeao.title}</p>
                <p class="descricao">${campeao.blurb}</p>
                <div class="tags">
                    ${campeao.tags.map(tag => `<span>${TRADUCAO_TAGS[tag] || tag}</span>`).join('')}
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button class="btn-skins" onclick="abrirModalSkins('${campeao.id}')">
                        <i class="ph-fill ph-paint-brush-broad"></i> Skins
                    </button>
                </div>
                <button class="btn-detalhes" onclick="abrirModal('${campeao.id}')">Ver Detalhes</button>
            </div>
        `;
        cardContainer.appendChild(article);
    });
}

// --- MODAL DE SKINS ---
async function abrirModalSkins(campeaoId) {
    const modal = document.getElementById("modal-skins-overlay");
    const modalContent = modal.querySelector(".modal-skins-content"); 
    const containerGaleria = document.getElementById("skins-gallery-container");
    const tituloModal = document.getElementById("skins-campeao-nome");

    containerGaleria.innerHTML = "<p style='color:white;'>Carregando visuais...</p>";
    tituloModal.innerText = campeaoId;
    
    modalContent.style.backgroundImage = `linear-gradient(to bottom, rgba(9, 20, 40, 0.9), rgba(9, 20, 40, 0.95)), url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${campeaoId}_0.jpg')`;

    // FIX: Reseta o scroll da galeria para o início
    document.getElementById("skins-gallery-container").scrollLeft = 0;

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    try {
        const urlDetalhada = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/data/pt_BR/champion/${campeaoId}.json`;
        const resposta = await fetch(urlDetalhada);
        const dados = await resposta.json();
        const skins = dados.data[campeaoId].skins;

        containerGaleria.innerHTML = ""; 

        skins.forEach(skin => {
            const div = document.createElement("div");
            div.classList.add("skin-card");
            const imgUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${campeaoId}_${skin.num}.jpg`;
            const nomeSkin = skin.name === "default" ? "Padrão" : skin.name;

            div.innerHTML = `
                <img src="${imgUrl}" alt="${nomeSkin}" width="308" height="560" loading="lazy">
                <p>${nomeSkin}</p>
            `;
            containerGaleria.appendChild(div);
        });
    } catch (erro) {
        console.error(erro);
        containerGaleria.innerHTML = "<p style='color:red;'>Erro ao carregar skins.</p>";
    }
}

function fecharModalSkins(event) {
    document.getElementById("modal-skins-overlay").classList.add("hidden");
    document.body.style.overflow = "auto";
}

// --- MODAL DE DETALHES ---
async function abrirModal(campeaoId) {
    const campeao = todosCampeoes.find(c => c.id === campeaoId);
    if (!campeao) return;

    const modal = document.getElementById("modal-overlay");
    const img = document.getElementById("modal-img");
    const nome = document.getElementById("modal-nome");
    const titulo = document.getElementById("modal-titulo");
    const desc = document.getElementById("modal-descricao");
    const statsBox = document.querySelector(".stats-box");
    const spellsContainer = document.getElementById("spells-container");

    // FIX: Reseta o scroll do modal para o topo
    modal.querySelector(".modal-content").scrollTop = 0;

    nome.innerText = campeao.name;
    titulo.innerText = campeao.title;
    img.src = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${campeao.id}_0.jpg`;
    desc.innerText = "Buscando arquivos nos arquivos de Runeterra...";
    if (spellsContainer) spellsContainer.innerHTML = "<p style='color: #a0a0a0'>Carregando habilidades...</p>";

    const info = campeao.info;
    const temStats = info.attack > 0 || info.defense > 0 || info.magic > 0 || info.difficulty > 0;

    if (temStats) {
        statsBox.style.display = "block";
        if (meuGrafico) meuGrafico.destroy();
        
        const ctx = document.getElementById('graficoPoder').getContext('2d');
        meuGrafico = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Ataque', 'Defesa', 'Magia', 'Dificuldade'],
                datasets: [{
                    label: 'Nível de Poder',
                    data: [info.attack, info.defense, info.magic, info.difficulty],
                    backgroundColor: 'rgba(200, 155, 60, 0.2)', 
                    borderColor: '#c89b3c',
                    pointBackgroundColor: '#f0e6d2',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#c89b3c',
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { color: 'rgba(91, 90, 86, 0.3)' },
                        grid: { color: 'rgba(91, 90, 86, 0.3)' },
                        pointLabels: { color: '#c89b3c', font: { size: 14, family: "'Quicksand', sans-serif" } },
                        ticks: { display: false, maxTicksLimit: 5 },
                        suggestedMin: 0, suggestedMax: 10
                    }
                },
                plugins: { legend: { display: false } },
                maintainAspectRatio: false
            }
        });
    } else {
        statsBox.style.display = "none";
    }

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    try {
        const urlDetalhada = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/data/pt_BR/champion/${campeaoId}.json`;
        const resposta = await fetch(urlDetalhada);
        const dadosJson = await resposta.json();
        const dadosDetalhados = dadosJson.data[campeaoId];
        
        desc.innerText = dadosDetalhados.lore;

        if (spellsContainer) {
            spellsContainer.innerHTML = ""; 
            
            const passiva = dadosDetalhados.passive;
            const imgPassiva = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/img/passive/${passiva.image.full}`;
            spellsContainer.innerHTML += `
                <div class="spell-card">
                    <div class="spell-img-wrapper">
                        <img src="${imgPassiva}" alt="${passiva.name}" width="64" height="64">
                        <span class="spell-key">P</span>
                    </div>
                    <div class="spell-info">
                        <h4>${passiva.name}</h4>
                        <p>${passiva.description}</p>
                    </div>
                </div>
            `;

            const teclas = ["Q", "W", "E", "R"];
            dadosDetalhados.spells.forEach((spell, index) => {
                const imgSpell = `https://ddragon.leagueoflegends.com/cdn/${versaoAtual}/img/spell/${spell.image.full}`;
                spellsContainer.innerHTML += `
                    <div class="spell-card">
                        <div class="spell-img-wrapper">
                            <img src="${imgSpell}" alt="${spell.name}" width="64" height="64">
                            <span class="spell-key">${teclas[index]}</span>
                        </div>
                        <div class="spell-info">
                            <h4>${spell.name}</h4>
                            <p>${spell.description}</p>
                        </div>
                    </div>
                `;
            });
        }

    } catch (erro) {
        console.error(erro);
        desc.innerText = campeao.blurb;
        if(spellsContainer) spellsContainer.innerHTML = "<p style='color:red'>Info indisponível.</p>";
    }
}

function fecharModal(event) {
    document.getElementById("modal-overlay").classList.add("hidden");
    document.body.style.overflow = "auto";
}

// --- SCROLL E ATALHOS ---
function irParaTopo() { window.scrollTo({ top: 0, behavior: "smooth" }); }
function irParaFinal() { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }

window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        btnTopo.classList.remove("hide");
        btnTopo.style.opacity = "1";
        btnTopo.style.pointerEvents = "all";
    } else {
        btnTopo.style.opacity = "0";
        btnTopo.style.pointerEvents = "none";
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        fecharModal();
        fecharModalSkins();
    }
});

botaoBusca.addEventListener("click", iniciarBusca);

// --- SCROLL HORIZONTAL (Mouse Wheel) ---
const skinsGallery = document.getElementById("skins-gallery-container");

skinsGallery.addEventListener("wheel", (evt) => {
    if (!document.getElementById("modal-skins-overlay").classList.contains("hidden")) {
        evt.preventDefault(); 
        // Aceleração 4x
        skinsGallery.scrollLeft += evt.deltaY * 4; 
    }
});