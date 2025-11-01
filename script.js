document.addEventListener('DOMContentLoaded', function() {
  // ------------------------------
  // LOGIN ADMIN POPUP
  // ------------------------------
  const btnEntrar = document.getElementById('btnEntrar');
  const popup = document.getElementById('loginPopup');
  const btnClose = document.getElementById('loginClose');
  const btnLoginConfirm = document.getElementById('loginConfirm');

  if (btnEntrar && popup) {
    btnEntrar.addEventListener('click', () => popup.classList.add('show'));
  }

  if (btnClose && popup) {
    btnClose.addEventListener('click', () => popup.classList.remove('show'));
  }

  if (btnLoginConfirm) {
    btnLoginConfirm.addEventListener('click', () => {
      const u = document.getElementById('adminUser').value || '';
      const p = document.getElementById('adminPass').value || '';

      if (u === 'Admin' && p === '1822br') {
        sessionStorage.setItem('adminLogado', 'true');
        popup.classList.remove('show');
        window.location.href = 'admin.html';
      } else {
        alert('Credenciais incorretas');
      }
    });
  }

  // ------------------------------
  // FORMULÁRIO "FAÇA PARTE"
  // ------------------------------
  const form = document.getElementById('formInscricao');
  if (form) {
    const motivoSel = document.getElementById('motivo');
    const campoMotivo = document.getElementById('campoMotivo');
    const notif = document.getElementById('notifOverlay');
    const notifClose = document.getElementById('notifClose');

    motivoSel.addEventListener('change', () => {
      if (motivoSel.value === 'outros')
        campoMotivo.classList.remove('d-none');
      else
        campoMotivo.classList.add('d-none');
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const data = {
        nome: document.getElementById('nome').value.trim(),
        idade: document.getElementById('idade').value.trim(),
        documento: document.getElementById('documento').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        email: document.getElementById('email').value.trim(),
        motivo: motivoSel.value,
        descricao: document.getElementById('descricao').value.trim(),
        enviadoEm: new Date().toISOString()
      };

      if (!data.nome || !data.documento || !data.email) {
        alert('Por favor, preencha Nome, Documento e E-mail.');
        return;
      }

      const arr = JSON.parse(localStorage.getItem('inscricoes') || '[]');
      arr.push(data);
      localStorage.setItem('inscricoes', JSON.stringify(arr));

      if (notif) notif.classList.add('show');

      form.reset();
      campoMotivo.classList.add('d-none');
    });

    // Fechar notificação e voltar à página inicial
    if (notifClose) {
      notifClose.addEventListener('click', () => {
        const notif = document.getElementById('notifOverlay');
        notif.classList.remove('show');

        // Garantia: redireciona mesmo se a animação não ocorrer
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 500);
      });
    }
  }

  // ------------------------------
  // PÁGINA ADMIN
  // ------------------------------
  if (window.location.pathname.split('/').pop() === 'admin.html') {
    if (sessionStorage.getItem('adminLogado') !== 'true') {
      alert('Acesso restrito: faça login.');
      window.location.href = 'index.html';
      return;
    }

    const container = document.getElementById('cardsContainer');
    const dados = JSON.parse(localStorage.getItem('inscricoes') || '[]');
    if (!container) return;

    if (dados.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum registro.</p>';
    } else {
      container.innerHTML = '';
      dados.forEach((d) => {
        const div = document.createElement('div');
        div.className = 'admin-card';
        div.innerHTML =
          '<h5 style="color:#4b5320">' +
          escapeHtml(d.nome) +
          '</h5>' +
          '<p><b>Idade:</b> ' + escapeHtml(d.idade) + '</p>' +
          '<p><b>ID:</b> ' + escapeHtml(d.documento) + '</p>' +
          '<p><b>Tel:</b> ' + escapeHtml(d.telefone) + '</p>' +
          '<p><b>Email:</b> ' + escapeHtml(d.email) + '</p>' +
          '<p><b>Motivo:</b> ' + escapeHtml(d.motivo) +
          (d.descricao ? ' - ' + escapeHtml(d.descricao) : '') + '</p>' +
          '<p style="font-size:12px;color:#666"><b>Enviado:</b> ' +
          new Date(d.enviadoEm).toLocaleString() + '</p>';
        container.appendChild(div);
      });
    }

    const btnExcluir = document.getElementById('btnExcluir');
    if (btnExcluir) {
      btnExcluir.addEventListener('click', () => {
        if (!confirm('Excluir todos os registros?')) return;
        const all = localStorage.getItem('inscricoes') || '[]';
        const blob = new Blob([all], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download =
          'backup_inscricoes_' +
          new Date().toISOString().slice(0, 10) +
          '.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        localStorage.removeItem('inscricoes');
        alert('Exportado e excluído.');
        window.location.reload();
      });
    }

    const btnVoltar = document.getElementById('btnVoltar');
    if (btnVoltar) {
      btnVoltar.addEventListener('click', () => {
        sessionStorage.removeItem('adminLogado');
        window.location.href = 'index.html';
      });
    }
  }

  // ------------------------------
  // FUNÇÃO DE SEGURANÇA
  // ------------------------------
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c])
    );
  }
});
