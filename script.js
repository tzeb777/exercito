// === CONFIG SUPABASE ===
const SUPABASE_URL = "https://vwnzmmyoesrjqpthsstg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bnptbXlvZXNyanFwdGhzc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTIyMTAsImV4cCI6MjA3NzUyODIxMH0.F6z3GoZbC-htwzOZSlOnwZUbVOSbgCSbeFE1qskQihw";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// === SENHA ADMIN ===
const ADMIN_PASS = "1822br";

document.addEventListener("DOMContentLoaded", () => {
  const tabela = document.querySelector("#tabelaInscricoes tbody");
  const btnEntrar = document.getElementById("btnEntrar");
  const btnSair = document.getElementById("btnSair");
  const form = document.getElementById("formInscricao");

  // === LOGIN ===
  if (btnEntrar) {
    btnEntrar.addEventListener("click", async () => {
      const senha = prompt("Digite a senha de administrador:");
      if (senha === ADMIN_PASS) {
        sessionStorage.setItem("adminAuth", "true");
        window.location.href = "admin.html";
      } else {
        alert("Senha incorreta!");
      }
    });
  }

  // === SAIR ===
  if (btnSair) {
    btnSair.addEventListener("click", () => {
      sessionStorage.removeItem("adminAuth");
      window.location.href = "index.html";
    });
  }

  // === VERIFICAR LOGIN E CARREGAR DADOS ===
  if (window.location.pathname.includes("admin.html")) {
    if (sessionStorage.getItem("adminAuth") !== "true") {
      window.location.href = "index.html";
      return;
    }
    carregarInscricoes();
  }

  // === ENVIAR FORMULÁRIO ===
  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = {
        nome: form.nome.value.trim(),
        idade: form.idade.value.trim(),
        documento: form.documento.value.trim(),
        telefone: form.telefone.value.trim(),
        email: form.email.value.trim(),
        area: form.area.value,
        motivo: form.motivo.value,
        descricao: form.descricao.value.trim()
      };

      const { error } = await supabase.from("inscricoes").insert([data]);

      if (error) {
        console.error(error);
        alert("Erro ao enviar inscrição!");
      } else {
        alert("Inscrição enviada com sucesso!");
        form.reset();
      }
    });
  }

  // === FUNÇÃO CARREGAR INSCRIÇÕES ===
  async function carregarInscricoes() {
    tabela.innerHTML = `<tr><td colspan="9" style="text-align:center;">Carregando...</td></tr>`;
    const { data, error } = await supabase.from("inscricoes").select("*").order("id", { ascending: false });

    if (error) {
      tabela.innerHTML = `<tr><td colspan="9" style="text-align:center;color:red;">Erro ao carregar dados</td></tr>`;
      console.error(error);
      return;
    }

    if (!data || data.length === 0) {
      tabela.innerHTML = `<tr><td colspan="9" style="text-align:center;">Nenhuma inscrição encontrada.</td></tr>`;
      return;
    }

    tabela.innerHTML = "";
    data.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.nome}</td>
        <td>${item.idade}</td>
        <td>${item.documento}</td>
        <td>${item.telefone}</td>
        <td>${item.email}</td>
        <td>${item.area}</td>
        <td>${item.motivo}</td>
        <td>${item.descricao || ""}</td>
        <td><button class="btn-apagar" data-id="${item.id}">Excluir</button></td>
      `;
      tabela.appendChild(tr);
    });

    document.querySelectorAll(".btn-apagar").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.target.dataset.id;
        if (confirm("Tem certeza que deseja excluir esta inscrição?")) {
          await supabase.from("inscricoes").delete().eq("id", id);
          carregarInscricoes();
        }
      });
    });
  }
});
