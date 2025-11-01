// ======= CONFIGURAÇÃO SUPABASE =======
const SUPABASE_URL = "https://vwnzmmyoesrjqpthsstg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bnptbXlvZXNyanFwdGhzc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTIyMTAsImV4cCI6MjA3NzUyODIxMH0.F6z3GoZbC-htwzOZSlOnwZUbVOSbgCSbeFE1qskQihw";

let supabaseClient;
(async () => {
  const { createClient } = window.supabase;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
})();

// ======= LOGIN ADMIN =======
document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar = document.getElementById("btnEntrar");
  if (btnEntrar) {
    btnEntrar.addEventListener("click", () => {
      const senha = prompt("Digite a senha de administrador:");
      if (senha === "1822br") {
        localStorage.setItem("adminLogado", "true");
        window.location.href = "admin.html";
      } else {
        alert("Senha incorreta!");
      }
    });
  }

  if (window.location.pathname.includes("admin.html")) {
    if (localStorage.getItem("adminLogado") !== "true") {
      alert("Acesso negado. Faça login primeiro!");
      window.location.href = "index.html";
      return;
    }
    carregarInscricoes();
  }

  const btnVoltar = document.getElementById("btnVoltar");
  if (btnVoltar) btnVoltar.addEventListener("click", () => {
    localStorage.removeItem("adminLogado");
    window.location.href = "index.html";
  });
});

// ======= FORMULÁRIO DE INSCRIÇÃO =======
document.addEventListener("submit", async (e) => {
  const form = document.getElementById("formInscricao");
  if (e.target === form) {
    e.preventDefault();

    const nome = document.getElementById("nome").value;
    const idade = document.getElementById("idade").value;
    const documento = document.getElementById("documento").value;
    const telefone = document.getElementById("telefone").value;
    const email = document.getElementById("email").value;
    const area = document.getElementById("area").value;
    const motivo = document.getElementById("motivo").value;
    const descricao = document.getElementById("descricao").value;

    try {
      const { data, error } = await supabaseClient
        .from("inscricoes")
        .insert([{ nome, idade, documento, telefone, email, area, motivo, descricao }]);

      if (error) throw error;

      document.getElementById("notifOverlay").style.display = "flex";
      form.reset();
    } catch (err) {
      console.error("Erro ao enviar:", err);
      alert("Erro ao enviar inscrição!");
    }
  }
});

// Fechar notificação
document.addEventListener("click", (e) => {
  if (e.target.id === "notifClose") {
    document.getElementById("notifOverlay").style.display = "none";
  }
});

// ======= CARREGAR INSCRIÇÕES NO ADMIN =======
async function carregarInscricoes() {
  const cardsContainer = document.getElementById("cardsContainer");
  if (!cardsContainer) return;

  cardsContainer.innerHTML = "<p>Carregando inscrições...</p>";

  const { data, error } = await supabaseClient.from("inscricoes").select("*");
  if (error) {
    cardsContainer.innerHTML = "<p>Erro ao carregar dados!</p>";
    console.error(error);
    return;
  }

  if (!data.length) {
    cardsContainer.innerHTML = "<p>Nenhuma inscrição encontrada.</p>";
    return;
  }

  renderizarCards(data);
}

// ======= RENDERIZAÇÃO =======
function renderizarCards(inscricoes) {
  const cardsContainer = document.getElementById("cardsContainer");
  cardsContainer.innerHTML = "";

  inscricoes.forEach((item) => {
    const card = document.createElement("div");
    card.classList.add("card-inscricao");
    card.innerHTML = `
      <input type="checkbox" class="chkExcluir" data-id="${item.id}">
      <h3>${item.nome}</h3>
      <p><b>Idade:</b> ${item.idade}</p>
      <p><b>Documento:</b> ${item.documento}</p>
      <p><b>Telefone:</b> ${item.telefone}</p>
      <p><b>Email:</b> ${item.email}</p>
      <p><b>Área:</b> ${item.area}</p>
      <p><b>Motivo:</b> ${item.motivo}</p>
      ${item.descricao ? `<p><b>Descrição:</b> ${item.descricao}</p>` : ""}
    `;
    cardsContainer.appendChild(card);
  });
}

// ======= EXCLUSÃO SELECIONADA =======
document.addEventListener("click", async (e) => {
  if (e.target.id === "btnExcluirSelecionados") {
    const checks = document.querySelectorAll(".chkExcluir:checked");
    if (!checks.length) return alert("Selecione pelo menos uma inscrição para excluir!");

    const ids = Array.from(checks).map(c => parseInt(c.dataset.id));
    if (!confirm(`Deseja excluir ${ids.length} inscrição(ões)?`)) return;

    const { error } = await supabaseClient.from("inscricoes").delete().in("id", ids);
    if (error) {
      alert("Erro ao excluir!");
      console.error(error);
      return;
    }

    alert("Inscrição(ões) excluída(s) com sucesso!");
    carregarInscricoes();
  }
});
