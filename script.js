// ========================
// 🔍 MODO DEBUG ATIVADO
// ========================
window.onerror = function (msg, src, line, col, err) {
  const div = document.createElement("div");
  div.style.position = "fixed";
  div.style.bottom = "10px";
  div.style.left = "10px";
  div.style.zIndex = "9999";
  div.style.background = "#ffdddd";
  div.style.border = "1px solid red";
  div.style.padding = "10px";
  div.style.fontFamily = "monospace";
  div.textContent = "⚠️ Erro JS: " + msg;
  document.body.appendChild(div);
  console.error("Erro detectado:", msg, src, line, col, err);
  return false;
};

// --- CONFIG SUPABASE ---
const SUPABASE_URL = "https://vwnzmmyoesrjqpthsstg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bnptbXlvZXNyanFwdGhzc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTIyMTAsImV4cCI6MjA3NzUyODIxMH0.F6z3GoZbC-htwzOZSlOnwZUbVOSbgCSbeFE1qskQihw";

if (!window.supabase) {
  alert("⚠️ Biblioteca Supabase não carregada! Verifique se o script do Supabase está incluído ANTES do script.js");
}

const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM READY ---
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ script.js carregado com sucesso");

  const isAdmin = window.location.pathname.includes("admin");
  const statusTxt = document.getElementById("status");
  const cardsContainer = document.getElementById("cardsContainer");
  const form = document.querySelector("form");
  const btnVoltar = document.getElementById("btnVoltar");
  const btnExcluir = document.getElementById("btnExcluir");
  const filtroArea = document.getElementById("filtroArea");

  // --- TESTE DE CONEXÃO SUPABASE ---
  try {
    const { data, error } = await supabase.from("inscricoes").select("*").limit(1);
    if (error) throw error;
    console.log("🟢 Conexão com Supabase OK");
  } catch (err) {
    console.error("🔴 Falha na conexão com Supabase:", err);
    alert("❌ Erro de conexão com Supabase: " + err.message);
  }

  // ====== FORM ENVIO ======
  if (form) {
    console.log("🧾 Formulário detectado na página");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        nome: form.nome.value.trim(),
        idade: form.idade.value.trim(),
        documento: form.documento.value.trim(),
        telefone: form.telefone.value.trim(),
        email: form.email.value.trim(),
        area: form.area.value,
        motivo: form.motivo.value.trim(),
        descricao: form.descricao.value.trim(),
        enviadoEm: new Date().toISOString(),
      };

      try {
        const { error } = await supabase.from("inscricoes").insert([data]);
        if (error) throw error;
        alert("✅ Inscrição enviada com sucesso!");
        form.reset();
      } catch (err) {
        alert("❌ Erro ao enviar: " + err.message);
      }
    });
  }

  // ====== ADMIN ======
  if (isAdmin && statusTxt && cardsContainer) {
    console.log("🛠️ Painel admin detectado");

    async function carregarInscricoes() {
      try {
        statusTxt.textContent = "Carregando dados...";
        const { data, error } = await supabase.from("inscricoes").select("*").order("id", { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) {
          statusTxt.textContent = "Nenhuma inscrição encontrada.";
          return;
        }

        statusTxt.textContent = `Total: ${data.length} registros`;
        cardsContainer.innerHTML = "";

        data.forEach((item) => {
          const div = document.createElement("div");
          div.className = "card";
          div.innerHTML = `
            <h3>${item.nome}</h3>
            <p><b>Área:</b> ${item.area}</p>
            <p><b>Email:</b> ${item.email}</p>
            <p><small>${new Date(item.enviadoEm).toLocaleString()}</small></p>
          `;
          cardsContainer.appendChild(div);
        });
      } catch (err) {
        statusTxt.textContent = "❌ Erro: " + err.message;
      }
    }

    await carregarInscricoes();
  }
});
