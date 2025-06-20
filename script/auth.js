// URL base do JSON Server
const API_URL = 'http://localhost:3000';

// Classe para gerenciar autenticação
class AuthManager {
    constructor() {
        this.usuarioLogado = this.getUsuarioLogado();
    }

    // Salva usuário na sessionStorage
    salvarUsuario(usuario) {
        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        this.usuarioLogado = usuario;
    }

    // Recupera usuário da sessionStorage
    getUsuarioLogado() {
        const usuario = sessionStorage.getItem('usuarioLogado');
        return usuario ? JSON.parse(usuario) : null;
    }

    // Remove usuário da sessionStorage
    logout() {
        sessionStorage.removeItem('usuarioLogado');
        this.usuarioLogado = null;
        window.location.href = 'index.html';
    }

    // Verifica se usuário está logado
    isLogado() {
        return this.usuarioLogado !== null;
    }

    // NOVA FUNÇÃO: Verifica se usuário é administrador
    isAdmin() {
        return this.isLogado() && this.usuarioLogado.admin === true;
    }

    // Faz login do usuário
    async login(email, senha) {
        try {
            const response = await fetch(`${API_URL}/usuarios`);
            const usuarios = await response.json();
            
            const usuario = usuarios.find(u => u.email === email && u.senha === senha);
            
            if (usuario) {
                this.salvarUsuario(usuario);
                return { sucesso: true, usuario };
            } else {
                return { sucesso: false, erro: 'Email ou senha inválidos' };
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return { sucesso: false, erro: 'Erro de conexão. Verifique se o JSON Server está rodando.' };
        }
    }

    // Cadastra novo usuário
    async cadastrar(nome, email, senha) {
        try {
            // Verifica se email já existe
            const response = await fetch(`${API_URL}/usuarios`);
            const usuarios = await response.json();
            
            const emailExiste = usuarios.find(u => u.email === email);
            if (emailExiste) {
                return { sucesso: false, erro: 'Este email já está cadastrado' };
            }

            // Cria novo usuário (sempre como usuário comum)
            const novoUsuario = {
                nome,
                email,
                senha,
                admin: false // Novos usuários sempre são criados como não-admin
            };

            const responsePost = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novoUsuario)
            });

            if (responsePost.ok) {
                const usuarioCriado = await responsePost.json();
                return { sucesso: true, usuario: usuarioCriado };
            } else {
                return { sucesso: false, erro: 'Erro ao cadastrar usuário' };
            }
        } catch (error) {
            console.error('Erro ao cadastrar:', error);
            return { sucesso: false, erro: 'Erro de conexão. Verifique se o JSON Server está rodando.' };
        }
    }

    // Gerencia favoritos
    async toggleFavorito(filme) {
        if (!this.isLogado()) {
            alert('Você precisa estar logado para favoritar filmes');
            return false;
        }

        try {
            const response = await fetch(`${API_URL}/favoritos`);
            const favoritos = await response.json();
            
            const favoritoExistente = favoritos.find(f => 
                f.usuarioId === this.usuarioLogado.id && f.filmeId === filme.imdbID
            );

            if (favoritoExistente) {
                // Remove dos favoritos
                await fetch(`${API_URL}/favoritos/${favoritoExistente.id}`, {
                    method: 'DELETE'
                });
                return false; // Não é mais favorito
            } else {
                // Adiciona aos favoritos
                const novoFavorito = {
                    usuarioId: this.usuarioLogado.id,
                    filmeId: filme.imdbID,
                    titulo: filme.Title,
                    poster: filme.Poster
                };

                await fetch(`${API_URL}/favoritos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(novoFavorito)
                });
                return true; // É favorito agora
            }
        } catch (error) {
            console.error('Erro ao gerenciar favorito:', error);
            return false;
        }
    }

    // Verifica se filme é favorito
    async isFavorito(filmeId) {
        if (!this.isLogado()) return false;

        try {
            const response = await fetch(`${API_URL}/favoritos`);
            const favoritos = await response.json();
            
            return favoritos.some(f => 
                f.usuarioId === this.usuarioLogado.id && f.filmeId === filmeId
            );
        } catch (error) {
            console.error('Erro ao verificar favorito:', error);
            return false;
        }
    }

    // Busca favoritos do usuário
    async getFavoritos() {
        if (!this.isLogado()) return [];

        try {
            const response = await fetch(`${API_URL}/favoritos`);
            const favoritos = await response.json();
            
            return favoritos.filter(f => f.usuarioId === this.usuarioLogado.id);
        } catch (error) {
            console.error('Erro ao buscar favoritos:', error);
            return [];
        }
    }
}

// Instância global do gerenciador de autenticação
const authManager = new AuthManager();

// Event listeners para formulários
document.addEventListener('DOMContentLoaded', () => {
    // Formulário de login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const mensagem = document.getElementById('mensagem');
            
            const resultado = await authManager.login(email, senha);
            
            if (resultado.sucesso) {
                mensagem.innerHTML = '<div class="sucesso">Login realizado com sucesso! Redirecionando...</div>';
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                mensagem.innerHTML = `<div class="erro">${resultado.erro}</div>`;
            }
        });
    }

    // Formulário de cadastro
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const confirmaSenha = document.getElementById('confirma-senha').value;
            const mensagem = document.getElementById('mensagem');
            
            if (senha !== confirmaSenha) {
                mensagem.innerHTML = '<div class="erro">As senhas não coincidem</div>';
                return;
            }
            
            const resultado = await authManager.cadastrar(nome, email, senha);
            
            if (resultado.sucesso) {
                mensagem.innerHTML = '<div class="sucesso">Cadastro realizado com sucesso! Redirecionando para login...</div>';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                mensagem.innerHTML = `<div class="erro">${resultado.erro}</div>`;
            }
        });
    }
});

// Função para atualizar o menu baseado no status de login
function atualizarMenu() {
    const actions = document.querySelector('.actions');
    if (!actions) return;

    const formPesquisa = actions.querySelector('form');
    
    if (authManager.isLogado()) {
        // Usuário logado - mostrar favoritos, admin (se for admin) e logout
        let menuAdmin = '';
        if (authManager.isAdmin()) {
            menuAdmin = '<a href="crud.html" style="color: white; margin-right: 10px;">👤 Gerenciar Usuários</a>';
        }
        
        actions.innerHTML = `
            ${formPesquisa ? formPesquisa.outerHTML : ''}
            <a href="favoritos.html" style="color: white; margin-right: 10px;">Favoritos</a>
            ${menuAdmin}
            <a href="#" id="btn-logout" style="color: white; margin-right: 10px;">Logout (${authManager.usuarioLogado.nome})</a>
        `;
        
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Deseja realmente sair?')) {
                    authManager.logout();
                }
            });
        }
    } else {
        // Usuário não logado - mostrar login e cadastro
        actions.innerHTML = `
            ${formPesquisa ? formPesquisa.outerHTML : ''}
            <a href="login.html" style="color: white; margin-right: 10px;">Login</a>
            <a href="cadastro.html" style="color: white; margin-right: 10px;">Cadastrar</a>
        `;
    }
}

// Chama a função para atualizar o menu quando a página carrega
document.addEventListener('DOMContentLoaded', atualizarMenu);