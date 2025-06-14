const apiKey = '8fa8be48';

const params = new URLSearchParams(window.location.search);
const termoPesquisa = params.get("pesquisa");
const filtro = params.get("filtro");

// Função genérica para criar cards de filme
async function criarItem(element) {
    let item = document.createElement("div");
    item.classList.add("item");
    
    // Verifica se o filme é favorito (apenas se usuário estiver logado)
    let isFavorito = false;
    if (typeof authManager !== 'undefined' && authManager.isLogado()) {
        isFavorito = await authManager.isFavorito(element.imdbID);
    }
    
    // Ícone de favorito (apenas se usuário estiver logado)
    const iconesFavorito = typeof authManager !== 'undefined' && authManager.isLogado() ? `
        <div class="favorito-icon" data-filme-id="${element.imdbID}" style="
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 24px;
            cursor: pointer;
            color: ${isFavorito ? '#e74c3c' : '#ccc'};
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        ">${isFavorito ? '❤️' : '🤍'}</div>
    ` : '';
    
    item.innerHTML = `
        <div style="position: relative;">
            <img src="${element.Poster !== "N/A" ? element.Poster : "imagens/sem-imagem.jpg"}" alt="${element.Title}" />
            ${iconesFavorito}
        </div>
        <h2>${element.Title}</h2>
    `;
    
    // Event listener para o card (ir para detalhes)
    item.addEventListener("click", (e) => {
        if (!e.target.classList.contains('favorito-icon')) {
            window.location.href = `detalhes.html?id=${element.imdbID}`;
        }
    });
    
    // Event listener para o ícone de favorito
    const icone = item.querySelector('.favorito-icon');
    if (icone) {
        icone.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            if (!authManager.isLogado()) {
                alert('Você precisa estar logado para favoritar filmes');
                return;
            }
            
            const novoStatus = await authManager.toggleFavorito(element);
            
            // Atualiza o ícone
            if (novoStatus) {
                icone.innerHTML = '❤️';
                icone.style.color = '#e74c3c';
            } else {
                icone.innerHTML = '🤍';
                icone.style.color = '#ccc';
            }
        });
    }
    
    return item;
}

// Preenche a lista principal
async function carregaLista(json) {
    const lista = document.querySelector("div.lista");
    lista.innerHTML = "";

    if (json.Response === 'False') {
        lista.innerHTML = "<p>Nenhum filme encontrado.</p>";
        return;
    }

    for (const element of json.Search) {
        const item = await criarItem(element);
        lista.appendChild(item);
    }
}

// Preenche os destaques
async function carregaDestaques() {
    const destaques = document.querySelector("div.lista-destaques");
    destaques.innerHTML = "";

    fetch(`https://www.omdbapi.com/?s=Marvel&apikey=${apiKey}`)
        .then(result => result.json())
        .then(async json => {
            if (json.Response === 'False') {
                destaques.innerHTML = "<p>Nenhum destaque encontrado.</p>";
                return;
            }
            for (const element of json.Search) {
                const item = await criarItem(element);
                destaques.appendChild(item);
            }
        });
}

// Verifica a página atual
if (window.location.pathname.includes("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("index")) {
    if (termoPesquisa) {
        fetch(`https://www.omdbapi.com/?s=${termoPesquisa}&apikey=${apiKey}`)
            .then(result => result.json())
            .then(json => {
                document.querySelector("section.destaques").style.display = "none";
                carregaLista(json);
            });
    } else if (filtro) {
        let termo = "";
        switch (filtro) {
            case "novos": termo = "2025"; break;
            case "populares": termo = "Avengers"; break;
            case "esportes": termo = "Football"; break;
            case "horror": termo = "Horror"; break;
            case "romance": termo = "Love"; break;
            case "disney": termo = "Disney"; break;
            case "netflix": termo = "Netflix"; break;
        }

        if (termo) {
            fetch(`https://www.omdbapi.com/?s=${termo}&apikey=${apiKey}`)
                .then(result => result.json())
                .then(json => {
                    document.querySelector("section.destaques").style.display = "none";
                    carregaLista(json);
                });
        }
    } else {
        carregaDestaques();
    }
}

// Página de detalhes
if (window.location.pathname.includes("detalhes.html")) {
    const movieId = params.get('id');
    if (movieId) {
        fetch(`https://www.omdbapi.com/?i=${movieId}&apikey=${apiKey}`)
            .then(result => result.json())
            .then(async json => {
                const detalhes = document.querySelector("#detalhes");
                
                // Verifica se é favorito
                let isFavorito = false;
                if (typeof authManager !== 'undefined' && authManager.isLogado()) {
                    isFavorito = await authManager.isFavorito(movieId);
                }
                
                // Botão de favorito (apenas se usuário estiver logado)
                const botaoFavorito = typeof authManager !== 'undefined' && authManager.isLogado() ? `
                    <button id="btn-favorito" style="
                        background-color: ${isFavorito ? '#e74c3c' : '#3498db'};
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 20px 0;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    ">${isFavorito ? '❤️ Remover dos Favoritos' : '🤍 Adicionar aos Favoritos'}</button>
                ` : '';
                
                detalhes.innerHTML = `
                    <h2>${json.Title}</h2>
                    <img src="${json.Poster !== "N/A" ? json.Poster : "imagens/sem-imagem.jpg"}" />
                    ${botaoFavorito}
                    <p><strong>Ano:</strong> ${json.Year}</p>
                    <p><strong>Gênero:</strong> ${json.Genre}</p>
                    <p><strong>Diretor:</strong> ${json.Director}</p>
                    <p><strong>Atores:</strong> ${json.Actors}</p>
                    <p><strong>Sinopse:</strong> ${json.Plot}</p>
                `;
                
                // Event listener para o botão de favorito
                const btnFavorito = document.getElementById('btn-favorito');
                if (btnFavorito) {
                    btnFavorito.addEventListener('click', async () => {
                        if (!authManager.isLogado()) {
                            alert('Você precisa estar logado para favoritar filmes');
                            return;
                        }
                        
                        const novoStatus = await authManager.toggleFavorito(json);
                        
                        // Atualiza o botão
                        if (novoStatus) {
                            btnFavorito.innerHTML = '❤️ Remover dos Favoritos';
                            btnFavorito.style.backgroundColor = '#e74c3c';
                        } else {
                            btnFavorito.innerHTML = '🤍 Adicionar aos Favoritos';
                            btnFavorito.style.backgroundColor = '#3498db';
                        }
                    });
                }
            });
    }
}

// Exibe aviso ao focar no input de pesquisa
document.addEventListener("DOMContentLoaded", () => {
    const inputPesquisa = document.querySelector("input[name='pesquisa']");
    const msg = document.querySelector("#mensagem-pesquisa");

    if (inputPesquisa && msg) {
        inputPesquisa.addEventListener("focus", () => {
            msg.style.display = "block";
        });
        inputPesquisa.addEventListener("blur", () => {
            msg.style.display = "none";
        });
    }
});