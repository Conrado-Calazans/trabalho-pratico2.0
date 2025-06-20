// URL base do JSON Server
const API_URL = 'http://localhost:3000';

// Variáveis globais
let usuarios = [];
let usuarioEditando = null;

// Função para gerar UUID
function generateUUID() {
    var d = new Date().getTime();
    var d2 = (performance && performance.now && (performance.now()*1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;
        if(d > 0){
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// Função para exibir mensagens
function displayMessage(message, type = 'success') {
    const msgDiv = document.getElementById('msg');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    
    msgDiv.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        const alert = msgDiv.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// Função para verificar se usuário é admin
function verificarPermissaoAdmin() {
    if (!authManager.isLogado()) {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'login.html';
        return false;
    }
    
    if (!authManager.isAdmin()) {
        alert('Acesso negado. Esta área é restrita a administradores.');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Função para carregar usuários da API
async function carregarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        if (!response.ok) {
            throw new Error('Erro ao carregar usuários');
        }
        
        usuarios = await response.json();
        preencherTabela();
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        displayMessage('Erro ao carregar usuários. Verifique se o JSON Server está rodando.', 'error');
    }
}

// Função para preencher a tabela com os usuários
function preencherTabela() {
    const tbody = document.getElementById('table-usuarios');
    
    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum usuário encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    usuarios.forEach(usuario => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.login || usuario.email}</td>
            <td>${usuario.nome}</td>
            <td>${usuario.email}</td>
            <td>
                <span class="badge ${usuario.admin ? 'bg-success' : 'bg-secondary'}">
                    ${usuario.admin ? 'Admin' : 'Usuário'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editarUsuario('${usuario.id}')">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmarExclusao('${usuario.id}', '${usuario.nome}')">
                    <i class="bi bi-trash"></i> Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Função para limpar o formulário
function limparFormulario() {
    document.getElementById('inputId').value = '';
    document.getElementById('inputLogin').value = '';
    document.getElementById('inputSenha').value = '';
    document.getElementById('inputNome').value = '';
    document.getElementById('inputEmail').value = '';
    document.getElementById('selectAdmin').value = '';
    
    usuarioEditando = null;
    
    // Resetar botões
    document.getElementById('btnInsert').style.display = 'inline-block';
    document.getElementById('btnUpdate').style.display = 'none';
    document.getElementById('btnDelete').style.display = 'none';
}

// Função para validar formulário
function validarFormulario() {
    const login = document.getElementById('inputLogin').value.trim();
    const senha = document.getElementById('inputSenha').value.trim();
    const nome = document.getElementById('inputNome').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    const admin = document.getElementById('selectAdmin').value;
    
    if (!login || !senha || !nome || !email || admin === '') {
        displayMessage('Todos os campos são obrigatórios!', 'error');
        return false;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        displayMessage('Por favor, insira um email válido!', 'error');
        return false;
    }
    
    return true;
}

// Função para inserir novo usuário
async function inserirUsuario() {
    if (!validarFormulario()) return;
    
    const login = document.getElementById('inputLogin').value.trim();
    const senha = document.getElementById('inputSenha').value.trim();
    const nome = document.getElementById('inputNome').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    const admin = document.getElementById('selectAdmin').value === 'true';
    
    // Verificar se login ou email já existem
    const loginExiste = usuarios.find(u => u.login === login || u.email === email);
    if (loginExiste) {
        displayMessage('Login ou email já existem!', 'error');
        return;
    }
    
    const novoUsuario = {
        id: generateUUID(),
        login: login,
        senha: senha,
        nome: nome,
        email: email,
        admin: admin
    };
    
    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoUsuario)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao inserir usuário');
        }
        
        displayMessage('Usuário inserido com sucesso!');
        limparFormulario();
        carregarUsuarios();
        
    } catch (error) {
        console.error('Erro ao inserir usuário:', error);
        displayMessage('Erro ao inserir usuário!', 'error');
    }
}

// Função para editar usuário
function editarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) {
        displayMessage('Usuário não encontrado!', 'error');
        return;
    }
    
    // Preencher formulário
    document.getElementById('inputId').value = usuario.id;
    document.getElementById('inputLogin').value = usuario.login || '';
    document.getElementById('inputSenha').value = usuario.senha;
    document.getElementById('inputNome').value = usuario.nome;
    document.getElementById('inputEmail').value = usuario.email;
    document.getElementById('selectAdmin').value = usuario.admin ? 'true' : 'false';
    
    usuarioEditando = usuario;
    
    // Ajustar botões
    document.getElementById('btnInsert').style.display = 'none';
    document.getElementById('btnUpdate').style.display = 'inline-block';
    document.getElementById('btnDelete').style.display = 'inline-block';
    
    // Scroll para o formulário
    document.getElementById('form-usuario').scrollIntoView({ behavior: 'smooth' });
}

// Função para atualizar usuário
async function atualizarUsuario() {
    if (!usuarioEditando) {
        displayMessage('Nenhum usuário selecionado para edição!', 'error');
        return;
    }
    
    if (!validarFormulario()) return;
    
    const login = document.getElementById('inputLogin').value.trim();
    const senha = document.getElementById('inputSenha').value.trim();
    const nome = document.getElementById('inputNome').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    const admin = document.getElementById('selectAdmin').value === 'true';
    
    // Verificar se login ou email já existem (exceto o próprio usuário)
    const loginExiste = usuarios.find(u => u.id !== usuarioEditando.id && (u.login === login || u.email === email));
    if (loginExiste) {
        displayMessage('Login ou email já existem!', 'error');
        return;
    }
    
    const usuarioAtualizado = {
        id: usuarioEditando.id,
        login: login,
        senha: senha,
        nome: nome,
        email: email,
        admin: admin
    };
    
    try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioEditando.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(usuarioAtualizado)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar usuário');
        }
        
        displayMessage('Usuário atualizado com sucesso!');
        limparFormulario();
        carregarUsuarios();
        
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        displayMessage('Erro ao atualizar usuário!', 'error');
    }
}

// Função para confirmar exclusão
function confirmarExclusao(id, nome) {
    // Impedir que admin exclua a si mesmo
    if (authManager.usuarioLogado && authManager.usuarioLogado.id === id) {
        displayMessage('Você não pode excluir sua própria conta!', 'error');
        return;
    }
    
    if (confirm(`Tem certeza que deseja excluir o usuário "${nome}"?\n\nEsta ação não pode ser desfeita.`)) {
        excluirUsuario(id);
    }
}

// Função para excluir usuário
async function excluirUsuario(id) {
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir usuário');
        }
        
        displayMessage('Usuário excluído com sucesso!');
        limparFormulario();
        carregarUsuarios();
        
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        displayMessage('Erro ao excluir usuário!', 'error');
    }
}

// Função de inicialização
function init() {
    // Verificar permissões
    if (!verificarPermissaoAdmin()) {
        return;
    }
    
    // Carregar usuários
    carregarUsuarios();
    
    // Event listeners para os botões
    document.getElementById('btnInsert').addEventListener('click', inserirUsuario);
    document.getElementById('btnUpdate').addEventListener('click', atualizarUsuario);
    document.getElementById('btnDelete').addEventListener('click', () => {
        if (usuarioEditando) {
            confirmarExclusao(usuarioEditando.id, usuarioEditando.nome);
        }
    });
    document.getElementById('btnClear').addEventListener('click', limparFormulario);
    
    // Inicialmente esconder botões de update e delete
    document.getElementById('btnUpdate').style.display = 'none';
    document.getElementById('btnDelete').style.display = 'none';
}

// Aguardar o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que o authManager foi inicializado
    setTimeout(init, 100);
});