let cart = [];
const TAXA_ENTREGA = 6;

/* ================= TOAST ================= */
const toast = document.createElement("div");
toast.className = "toast";
document.body.appendChild(toast);

function mostrarToast(mensagem) {
  toast.innerText = mensagem;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}

/* ================= ADICIONAR ================= */
function aumentar(nome, preco, el) {
  const itemDiv = el.closest(".item");

  let extras = [];
  itemDiv.querySelectorAll(".extras input:checked").forEach(c => {
    extras.push({
      nome: c.dataset.nome,
      preco: Number(c.dataset.preco)
    });
  });

  let existente = cart.find(i =>
    i.nome === nome &&
    JSON.stringify(i.extras) === JSON.stringify(extras)
  );

  if (existente) {
    existente.qtd++;
  } else {
    cart.push({
      nome,
      preco,
      extras,
      qtd: 1,
      obs: ""
    });
  }

  atualizarCarrinho();
  mostrarToast("Item adicionado!");
}

/* ================= DIMINUIR ================= */
function diminuir(nome, el) {
  const itemDiv = el.closest(".item");

  let extras = [];
  itemDiv.querySelectorAll(".extras input:checked").forEach(c => {
    extras.push({
      nome: c.dataset.nome,
      preco: Number(c.dataset.preco)
    });
  });

  let index = cart.findIndex(i =>
    i.nome === nome &&
    JSON.stringify(i.extras) === JSON.stringify(extras)
  );

  if (index > -1) {
    cart[index].qtd--;

    if (cart[index].qtd <= 0) {
      removerItem(index);
      return;
    }
  }

  atualizarCarrinho();
}

/* ================= CARRINHO ================= */
function atualizarCarrinho() {
  const cartItems = document.getElementById("cartItems");
  const totalEl = document.getElementById("total");

  cartItems.innerHTML = "";
  let total = 0;
  let count = 0;

  cart.forEach((item, index) => {
    let extrasTotal = item.extras.reduce((acc, e) => acc + e.preco, 0);
    let subtotal = (item.preco + extrasTotal) * item.qtd;

    cartItems.innerHTML += `
      <div class="cart-item">
        <div class="cart-item-header">
          <strong>${item.qtd}x ${item.nome}</strong>
          <button class="remove-btn" onclick="removerItem(${index})">✕</button>
        </div>

        ${item.extras.length ? `
          <div class="extras-list">
            ${item.extras.map((e, i) => `
              <div>
                <span>+ ${e.nome}</span>
                <button class="remove-btn" onclick="removerExtra(${index}, ${i})">✕</button>
              </div>
            `).join("")}
          </div>
        ` : ""}

        <input 
          type="text" 
          placeholder="Observação..." 
          value="${item.obs || ""}"
          oninput="atualizarObs(${index}, this.value)"
        >
      </div>
    `;

    total += subtotal;
    count += item.qtd;
  });

  totalEl.innerText = "Total: R$ " + total;
  document.getElementById("cartCount").innerText = count;
}

/* ================= REMOVER ================= */
function removerItem(index) {
  const cartItems = document.getElementById("cartItems");
  const itemEl = cartItems.children[index];

  itemEl.classList.add("removing");

  setTimeout(() => {
    cart.splice(index, 1);
    atualizarCarrinho();
    mostrarToast("Item removido!");
  }, 300);
}

function removerExtra(itemIndex, extraIndex) {
  cart[itemIndex].extras.splice(extraIndex, 1);
  atualizarCarrinho();
  mostrarToast("Adicional removido!");
}

/* ================= OBS ================= */
function atualizarObs(index, valor) {
  cart[index].obs = valor;
}

/* ================= ABRIR / FECHAR ================= */
function abrirCarrinho() {
  document.getElementById("cartDrawer").classList.add("active");
  document.getElementById("overlay").classList.add("active");
}

function fecharCarrinho() {
  document.getElementById("cartDrawer").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
}

/* ================= EXTRAS ================= */
function toggleExtras(btn) {
  const item = btn.closest(".item");
  item.querySelector(".extras").classList.toggle("hidden");
}

/* ================= ENTREGA ================= */
document.querySelectorAll('input[name="tipoEntrega"]').forEach(r => {
  r.addEventListener("change", () => {
    const isEntrega = r.value === "entrega" && r.checked;

    document.getElementById("entregaCampos")
      .classList.toggle("hidden", !isEntrega);

    document.getElementById("avisoEntrega")
      .classList.toggle("hidden", !isEntrega);
  });
});

/* ================= CEP ================= */
const cepInput = document.getElementById("cep");

if (cepInput) {
  cepInput.addEventListener("blur", async function () {
    const cep = this.value.replace(/\D/g, "");

    if (cep.length !== 8) {
      mostrarToast("CEP inválido!");
      return;
    }

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();

      if (data.erro) {
        mostrarToast("CEP não encontrado!");
        return;
      }

      document.getElementById("enderecoCompleto").innerHTML =
        `${data.logradouro}, ${data.bairro}<br>${data.localidade} - ${data.uf}`;
    } catch {
      mostrarToast("Erro ao buscar CEP");
    }
  });
}

/* ================= FINALIZAR ================= */
function finalizar() {
  let tipo = document.querySelector('input[name="tipoEntrega"]:checked');

  if (!tipo) {
    mostrarToast("Escolha retirada ou entrega!");
    return;
  }

  let msg = "Olá, quero pedir:%0A%0A";
  let total = 0;

  cart.forEach(item => {
    let extrasNomes = item.extras.map(e => e.nome);
    let extrasTotal = item.extras.reduce((acc, e) => acc + e.preco, 0);
    let subtotal = (item.preco + extrasTotal) * item.qtd;

    msg += `${item.qtd}x ${item.nome}%0A`;

    if (item.obs) {
      msg += `OBS: ${item.obs}%0A`;
    }

    if (extrasNomes.length) {
      msg += `Adicionais:%0A`;
      extrasNomes.forEach(e => {
        msg += `- ${e}%0A`;
      });
    }

    msg += `%0A`;
    total += subtotal;
  });

  if (tipo.value === "entrega") {
    const cep = document.getElementById("cep").value;
    const numero = document.getElementById("numero").value;
    const endereco = document.getElementById("enderecoCompleto").innerText;

    if (!cep || !numero || !endereco) {
      mostrarToast("Preencha o endereço!");
      return;
    }

    total += TAXA_ENTREGA;

    msg += `🚚 Entrega%0A${endereco}%0A`;
    msg += `Número: ${numero}%0A`;
    msg += `CEP: ${cep}%0A`;
    msg += `Taxa: R$ ${TAXA_ENTREGA}%0A%0A`;
  } else {
    msg += `📍 Retirada no local%0A%0A`;
  }

  msg += `Total: R$ ${total}`;

  window.open(`https://wa.me/19991622336?text=${msg}`);
}

/* ================= ROTA ================= */
function abrirRota() {
  const endereco = "Praça Princesa Isabel, 55 - Mococa SP";

  const isMobile = /Android|iPhone/i.test(navigator.userAgent);

  if (isMobile) {
    window.open(`geo:0,0?q=${encodeURIComponent(endereco)}`);
  } else {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}`);
  }
}