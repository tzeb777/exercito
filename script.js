// ===========================================================
// CONFIGURAÇÃO SUPABASE
// ===========================================================
const SUPABASE_URL = "https://vwnzmmyoesrjqpthsstg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bnptbXlvZXNyanFwdGhzc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTIyMTAsImV4cCI6MjA3NzUyODIxMH0.F6z3GoZbC-htwzOZSlOnwZUbVOSbgCSbeFE1qskQihw";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===========================================================
// AO CARREGAR O SITE
// ===========================================================
document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------
  // LOGIN ADMIN POPUP
  // ------------------------------
  const btnEntrar = document.getElementById("btnEntrar");
  const popup = document.getElementById("loginPopup");
  const btnClose = document.getElementById("loginClose");
  const btnLoginConfirm = document.getElementById("loginConfirm");

  if (btnEntrar && popup) btnEntrar.addEventListener("click", () => popup.classList.add("show"));
  if (btnClose && popup) btnClose.addEventListener("click", () => popup.classList.remove("show"));

  if (btnLoginConfirm) {
    btnLoginConfirm.addEventListener("click", () => {
      const u = document.getElementById("adminUser").value || "";
      const p = document.getElementById("adminPass").value || "";

      if (u === "Admin" && p === "1822br") {
        sessionStorage.setItem("adminLogado", "true");
        popup.classList.remove("show");
        window.location.href = "admin.html";
      } else {
        alert("Credenciais incorretas");
      }
    });
  }

  // ------------------------------
  // FORMULÁRIO "FAÇA PARTE"
  // ------------------------------
  const form = document.getElementById("formInscricao");
  if (form) {
    const motivoSel = document.getElementById("motivo");
    const campoMotivo = document.getElementById("campoMotivo");
    const notif = document.getElementById("notifOverlay");
    const notifClose = document.getElementById("notifClose");
    const areaSel = document.getElementById("area");

    motivoSel.addEventListener("change", () => {
      if (motivoSel.value === "outros") campoMotivo.classList.remove("d-none");
      else campoMotivo.classList.add("d-none");
    });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const data = {
        nome: document.getElementById("nome").value.trim(),
        idade: document.getElementById("idade").value.trim(),
        documento: document.getElementById("documento").value.trim(),
        telefone: document.getElementById("telefone").value.trim(),
        email: document.getElementById("email").value.trim(),
        area: areaSel ? areaSel.value : "",
        motivo: motivoSel.value,
        descricao: document.getElementById("descricao").value.trim(),
        enviadoEm: new Date().toISOString(),
      };

      if (!data.nome || !data.documento || !data.email || !data.area) {
        showAlert("Por favor, preencha todos os campos obrigatórios.");
        return;
      }

      // Enviar para o Supabase
      const { error } = await supabase.from("inscricoes").insert([data]);

      if (error) {
        console.error(error);
        showAlert("Erro ao enviar inscrição.");
        return;
      }

      if (notif) notif.classList.add("show");
      form.reset();
      campoMotivo.classList.add("d-none");
    });

    if (notifClose) {
      notifClose.addEventListener("click", () => {
        notif.classList.remove("show");
        setTimeout(() => window.close(), 400);
      });
    }
  }

  // ------------------------------
  // PÁGINA ADMIN (LEITURA SUPABASE)
  // ------------------------------
  if (window.location.pathname.split("/").pop() === "admin.html") {
    if (sessionStorage.getItem("adminLogado") !== "true") {
      alert("Acesso restrito: faça login.");
      window.location.href = "index.html";
      return;
    }

    const container = document.getElementById("cardsContainer");
    const filtro = document.getElementById("filtroArea");
    const statusTxt = document.getElementById("status");

    async function carregarInscricoes() {
      statusTxt.textContent = "Carregando registros...";
      const { data, error } = await supabase
        .from("inscricoes")
        .select("*")
        .order("enviadoEm", { ascending: false });

      if (error) {
        console.error(error);
        statusTxt.textContent = "Erro ao carregar dados.";
        return;
      }

      statusTxt.textContent = `Total: ${data.length} registros`;
      renderCards(data);
    }

    function renderCards(dados) {
      const filtroSel = filtro.value;
      container.innerHTML = "";

      const filtrados =
        filtroSel === "todos"
          ? dados
          : dados.filter((d) => (d.area || "").toLowerCase() === filtroSel);

      if (filtrados.length === 0) {
        container.innerHTML = "<p class='text-muted'>Nenhum registro encontrado.</p>";
        return;
      }

      filtrados.forEach((d) => {
        const div = document.createElement("div");
        div.className = "admin-card";
        div.innerHTML = `
          <h5 style="color:#4b5320">${escapeHtml(d.nome)}</h5>
          <p><b>Idade:</b> ${escapeHtml(d.idade)}</p>
          <p><b>ID:</b> ${escapeHtml(d.documento)}</p>
          <p><b>Tel:</b> ${escapeHtml(d.telefone)}</p>
          <p><b>Email:</b> ${escapeHtml(d.email)}</p>
          <p><b>Área:</b> ${escapeHtml(d.area || "Não informado")}</p>
          <p><b>Motivo:</b> ${escapeHtml(d.motivo)} ${
          d.descricao ? "- " + escapeHtml(d.descricao) : ""
        }</p>
          <p style="font-size:12px;color:#666"><b>Enviado:</b> ${new Date(
            d.enviadoEm
          ).toLocaleString()}</p>
        `;
        container.appendChild(div);
      });
    }

    filtro.addEventListener("change", carregarInscricoes);

    document.getElementById("btnVoltar").addEventListener("click", () => {
      sessionStorage.removeItem("adminLogado");
      window.location.href = "index.html";
    });

    document.getElementById("btnExcluir").addEventListener("click", async () => {
      if (!confirm("Deseja excluir todos os registros da tabela Supabase?")) return;
      const { error } = await supabase.from("inscricoes").delete().neq("id", 0);
      if (error) showAlert("Erro ao excluir registros.");
      else {
        showAlert("Todos os registros foram removidos!");
        carregarInscricoes();
      }
    });

    // Atualização em tempo real
    supabase
      .channel("inscricoes_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inscricoes" }, (payload) => {
        console.log("Alteração detectada:", payload);
        carregarInscricoes();
      })
      .subscribe();

    carregarInscricoes();
  }

  // ===========================================================
  // PROTEÇÃO HTML / ALERTA PERSONALIZADO
  // ===========================================================
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c])
    );
  }

  function showAlert(message) {
    const overlay = document.createElement("div");
    overlay.className = "custom-alert";

    const card = document.createElement("div");
    card.className = "custom-alert-card";

    const msg = document.createElement("p");
    msg.textContent = message;

    const btn = document.createElement("button");
    btn.className = "btn-outline-success";
    btn.textContent = "Fechar";
    btn.onclick = () => overlay.remove();

    card.appendChild(msg);
    card.appendChild(btn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }
});
