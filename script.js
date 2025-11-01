// ====== CONEXÃO SUPABASE ======
const SUPABASE_URL = "https://vwnzmmyoesrjqpthsstg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bnptbXlvZXNyanFwdGhzc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTIyMTAsImV4cCI6MjA3NzUyODIxMH0.F6z3GoZbC-htwzOZSlOnwZUbVOSbgCSbeFE1qskQihw";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ====== FORMULÁRIO ======
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formInscricao");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = document.getElementById("nome").value.trim();
      const idade = document.getElementById("idade").value.trim();
      const documento = document.getElementById("documento").value.trim();
      const telefone = document.getElementById("telefone").value.trim();
      const email = document.getElementById("email").value.trim();
      const area = document.getElementById("area").value.trim();
      const motivo = document.getElementById("motivo").value.trim();
      const descricao = document.getElementById("descricao").value.trim();

      try {
        const { error } = await supabaseClient
          .from("inscricoes")
          .insert([{ nome, idade, documento, telefone, email, area, motivo, descricao }]);

        if (error) throw error;

        // Mostra notificação
        const overlay = document.getElementById("notifOverlay");
        if (overlay) overlay.style.display = "flex";

        form.reset();
      } catch (err) {
        console.error("Erro ao enviar:", err);
        alert("Erro ao enviar inscrição!");
      }
    });
  }

  const notifClose = document.getElementById("notifClose");
  if (notifClose) {
    notifClose.addEventListener("click", () => {
      document.getElementById("notifOverlay").style.display = "none";
    });
  }
});

// ====== LOGIN ADMIN ======
document.addEventListener("DOMContentLoaded", async () => {
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
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (supabaseClient) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });

    if (localStorage.getItem("adminLogado") !== "true") {
      alert("Acesso negado. Faça login primeiro!");
      window.location.href = "index.html";
      return;
    }

    carregarInscricoes();
  }

  const btnVoltar = document.getElementById("btnVoltar");
  if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
      localStorage.removeItem("adminLogado");
      window.location.href = "index.html";
    });
  }
});

// ====== CARREGAR INSCRIÇÕES ======
async function carregarInscricoes() {
  try {
    const tabelaCorpo = document.getElementById("tabelaCorpo");
    if (!tabelaCorpo) return;

    const { data, error } = await supabaseClient.from("inscricoes").select("*");
    if (error) throw error;

    if (!data || data.length === 0) {
      tabelaCorpo.innerHTML = "<tr><td colspan='8'>Nenhuma inscrição encontrada.</td></tr>";
      return;
    }

    tabelaCorpo.innerHTML = "";
    data.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.nome}</td>
        <td>${item.idade}</td>
        <td>${item.documento}</td>
        <td>${item.telefone}</td>
        <td>${item.email}</td>
        <td>${item.area}</td>
        <td>${item.motivo}</td>
        <td>${item.descricao || "-"}</td>
      `;
      tabelaCorpo.appendChild(row);
    });
  } catch (err) {
    console.error("Erro ao carregar inscrições:", err);
  }
}
