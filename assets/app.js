(function () {
  "use strict";

  const CATALOG_PATH = "./data/apps.json";
  const DETAILS_PATH = "./data/apps/";
  const APP_VISUALS = {
    "inverpep": {
      label: "Base de datos AMP",
      monogram: "INV",
      logo: "./assets/logos/logo-inverpep-shield.png",
      logoScale: 1.22,
      accent: "#0f766e",
      accentSoft: "#d7f3ee",
      glow: "rgba(15, 118, 110, 0.18)"
    },
    "sequence-filter": {
      label: "Patrones y filtros",
      monogram: "SEQ",
      logo: "./assets/logos/logo-sequencefilter.png",
      logoScale: 1.18,
      accent: "#2563eb",
      accentSoft: "#dbeafe",
      glow: "rgba(37, 99, 235, 0.2)"
    },
    "traductor": {
      label: "ADN ARN proteina",
      monogram: "TRD",
      accent: "#7c3aed",
      accentSoft: "#ede9fe",
      glow: "rgba(124, 58, 237, 0.18)"
    },
    "type-peptide": {
      label: "Visualizacion 3D",
      monogram: "TYP",
      logo: "./assets/logos/logo-typepeptide.png",
      logoScale: 1.5,
      accent: "#0ea5a4",
      accentSoft: "#d8f7f5",
      glow: "rgba(14, 165, 164, 0.18)"
    },
    "calcampi": {
      label: "Calculo fisicoquimico",
      monogram: "CAL",
      accent: "#0891b2",
      accentSoft: "#d7f4fb",
      glow: "rgba(8, 145, 178, 0.18)"
    },
    "pepmultitools": {
      label: "Suite de microservicios",
      monogram: "PMT",
      logo: "./assets/logos/logo-pepmultitools.png",
      logoScale: 1.2,
      accent: "#9333ea",
      accentSoft: "#f3e8ff",
      glow: "rgba(147, 51, 234, 0.18)"
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    const page = document.body.dataset.page;

    if (page === "home") {
      initHomePage();
    }

    if (page === "detail") {
      initDetailPage();
    }
  });

  async function initHomePage() {
    const listElement = document.getElementById("apps-list");
    const emptyElement = document.getElementById("apps-empty");
    const countElement = document.getElementById("apps-count");
    const searchInput = document.getElementById("app-search");

    try {
      const catalog = await fetchJson(CATALOG_PATH);
      const apps = Array.isArray(catalog.apps) ? catalog.apps : [];

      renderAppCards(apps, listElement, emptyElement, countElement);

      searchInput.addEventListener("input", function () {
        const query = normalizeText(searchInput.value);
        const filteredApps = apps.filter(function (app) {
          return normalizeText([
            app.nombre,
            app.descripcion,
            app.responsable,
            app.estado
          ].join(" ")).includes(query);
        });

        renderAppCards(filteredApps, listElement, emptyElement, countElement, apps.length);
      });
    } catch (error) {
      showError(listElement, "No fue posible cargar el catalogo de aplicaciones.");
      countElement.textContent = "Catalogo no disponible";
    }
  }

  async function initDetailPage() {
    const detailElement = document.getElementById("app-detail");
    const params = new URLSearchParams(window.location.search);
    const appId = params.get("app");

    if (!appId) {
      showError(detailElement, "No se indico una aplicacion para consultar.");
      return;
    }

    try {
      const app = await fetchJson(`${DETAILS_PATH}${encodeURIComponent(appId)}.json`);
      renderAppDetail(app, detailElement);
      document.title = `${app.nombre || "Aplicacion"} | Portal de Documentacion`;
    } catch (error) {
      showError(
        detailElement,
        "No fue posible cargar la ficha de esta aplicacion. Verifica que el enlace sea correcto."
      );
    }
  }

  async function fetchJson(path) {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(`Error al cargar ${path}`);
    }

    return response.json();
  }

  function renderAppCards(apps, container, emptyElement, countElement, totalCount) {
    container.innerHTML = "";
    emptyElement.hidden = apps.length > 0;

    const total = typeof totalCount === "number" ? totalCount : apps.length;
    countElement.textContent = apps.length === total
      ? `${apps.length} aplicaciones registradas`
      : `${apps.length} de ${total} aplicaciones`;

    apps.forEach(function (app) {
      const visual = getAppVisual(app.id);
      const card = document.createElement("article");
      card.className = "app-card";
      card.style.setProperty("--app-accent", visual.accent);
      card.style.setProperty("--app-accent-soft", visual.accentSoft);
      card.style.setProperty("--app-glow", visual.glow);

      const metadata = document.createElement("div");
      metadata.className = "meta-row";

      if (app.responsable) {
        metadata.appendChild(createTag(app.responsable));
      }

      if (app.estado) {
        metadata.appendChild(createTag(app.estado));
      }

      card.innerHTML = `
        <div class="card-body">
          <div class="card-hero">
            ${createVisualMarkup(visual, "card")}
            <div class="card-hero-copy">
              <p class="card-kicker">${escapeHtml(visual.label)}</p>
            </div>
          </div>
          <h3>${escapeHtml(app.nombre || "Aplicacion sin nombre")}</h3>
          <p class="muted">${escapeHtml(app.descripcion || "Informacion en proceso de migracion.")}</p>
        </div>
      `;

      card.querySelector(".card-body").appendChild(metadata);
      card.insertAdjacentHTML(
        "beforeend",
        `<a class="button" href="./app.html?app=${encodeURIComponent(app.id)}">Ver detalle</a>`
      );

      container.appendChild(card);
    });
  }

  function renderAppDetail(app, container) {
    container.innerHTML = "";

    const visual = getAppVisual(app.id);
    const header = document.createElement("header");
    header.className = "detail-header";
    header.style.setProperty("--app-accent", visual.accent);
    header.style.setProperty("--app-accent-soft", visual.accentSoft);
    header.innerHTML = `
      <div class="detail-hero">
        ${createVisualMarkup(visual, "detail")}
        <div>
          <p class="detail-kicker">${escapeHtml(visual.label)}</p>
          <h2>${escapeHtml(app.nombre || "Aplicacion sin nombre")}</h2>
        </div>
      </div>
      <p>${escapeHtml(app.descripcion || "Informacion en proceso de migracion.")}</p>
    `;

    container.appendChild(header);

    const overview = document.createElement("section");
    overview.className = "detail-overview";

    const contactBox = document.createElement("div");
    contactBox.className = "info-box";
    contactBox.appendChild(createContactsSection("Contacto", app.responsables));

    const updateBox = document.createElement("div");
    updateBox.className = "info-box";
    updateBox.appendChild(createTextSection("Ultima actualizacion", app.ultimaActualizacion));

    overview.appendChild(contactBox);
    overview.appendChild(updateBox);
    container.appendChild(overview);

    const content = document.createElement("div");
    content.className = "detail-content";
    content.appendChild(createTextSection("Objetivo", app.objetivo));
    content.appendChild(createTextSection("Uso general", app.uso));
    content.appendChild(createListSection("Inputs", app.inputs));
    content.appendChild(createListSection("Outputs", app.outputs));
    content.appendChild(createExtraSections(app.secciones));
    content.appendChild(createDocumentsSection(app.documentos));

    container.appendChild(content);
  }

  function createTextSection(title, value) {
    const section = document.createElement("section");
    section.className = "detail-section";
    section.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(value || "Pendiente por completar.")}</p>
    `;
    return section;
  }

  function createListSection(title, items) {
    const section = document.createElement("section");
    section.className = "detail-section";
    const safeItems = Array.isArray(items) ? items : [];

    section.innerHTML = `<h3>${escapeHtml(title)}</h3>`;

    if (safeItems.length === 0) {
      section.insertAdjacentHTML("beforeend", `<p class="muted">Pendiente por completar.</p>`);
      return section;
    }

    const list = document.createElement("ul");
    list.className = "plain-list";

    safeItems.forEach(function (item) {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      list.appendChild(listItem);
    });

    section.appendChild(list);
    return section;
  }

  function createDocumentsSection(documents) {
    const section = document.createElement("section");
    section.className = "detail-section";
    const safeDocuments = Array.isArray(documents) ? documents : [];

    section.innerHTML = "<h3>Documentos asociados</h3>";

    if (safeDocuments.length === 0) {
      section.insertAdjacentHTML(
        "beforeend",
        `<p class="muted">No hay documentos cargados todavia.</p>`
      );
      return section;
    }

    const list = document.createElement("div");
    list.className = "documents-list";

    safeDocuments.forEach(function (documentInfo) {
      list.appendChild(createDocumentCard(documentInfo));
    });

    section.appendChild(list);
    return section;
  }

  function createDocumentCard(documentInfo) {
    const item = document.createElement("article");
    item.className = "document-card";

    const path = documentInfo.archivo || documentInfo.url || "#";
    const title = documentInfo.titulo || documentInfo.nombre || "Documento sin nombre";
    const extension = getFileExtension(path);

    item.innerHTML = `
      <div class="document-head">
        <div>
          <h4>${escapeHtml(title)}</h4>
          <p class="muted">${escapeHtml(documentInfo.descripcion || describeDocumentType(extension))}</p>
        </div>
        <span class="doc-badge">${escapeHtml(extension.toUpperCase() || "DOC")}</span>
      </div>
    `;

    if (extension === "pdf") {
      const preview = document.createElement("details");
      preview.className = "document-preview";
      preview.innerHTML = `
        <summary>Visualizar dentro de la app</summary>
        <iframe
          class="pdf-viewer"
          src="${escapeAttribute(`${path}#zoom=100`)}"
          title="${escapeAttribute(title)}"
          loading="lazy"
        ></iframe>
      `;
      item.appendChild(preview);
    }

    if (extension === "pdf") {
      const actions = document.createElement("div");
      actions.className = "document-actions";
      actions.appendChild(createActionLink("Descargar PDF", path, true));
      item.appendChild(actions);
    }

    return item;
  }

  function createActionLink(label, href, download) {
    const link = document.createElement("a");
    link.className = download ? "button button-secondary" : "button";
    link.href = href;
    link.textContent = label;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    if (download) {
      link.setAttribute("download", "");
    }

    return link;
  }

  function createExtraSections(sections) {
    const wrapper = document.createElement("div");
    const safeSections = Array.isArray(sections) ? sections : [];

    safeSections.forEach(function (sectionData) {
      const section = document.createElement("section");
      section.className = "detail-section";

      section.innerHTML = `<h3>${escapeHtml(sectionData.titulo || "Informacion adicional")}</h3>`;

      if (sectionData.texto) {
        section.insertAdjacentHTML("beforeend", `<p>${escapeHtml(sectionData.texto)}</p>`);
      }

      if (Array.isArray(sectionData.items) && sectionData.items.length > 0) {
        const list = document.createElement("ul");
        list.className = "plain-list";

        sectionData.items.forEach(function (item) {
          const listItem = document.createElement("li");
          listItem.textContent = item;
          list.appendChild(listItem);
        });

        section.appendChild(list);
      }

      if (Array.isArray(sectionData.cards) && sectionData.cards.length > 0) {
        const cards = document.createElement("div");
        cards.className = "feature-grid";

        sectionData.cards.forEach(function (cardData) {
          const card = document.createElement("article");
          card.className = "feature-card";

          const imageMarkup = cardData.logo
            ? `<img class="feature-logo" src="${escapeAttribute(cardData.logo)}" alt="${escapeAttribute(cardData.titulo || "Logo del módulo")}">`
            : "";
          const textMarkup = cardData.texto
            ? `<p>${escapeHtml(cardData.texto)}</p>`
            : '<p class="muted">Pendiente por completar.</p>';
          const listMarkup = Array.isArray(cardData.items) && cardData.items.length > 0
            ? `<ul class="plain-list">${cardData.items.map(function (item) {
              return `<li>${escapeHtml(item)}</li>`;
            }).join("")}</ul>`
            : "";

          card.innerHTML = `
            ${imageMarkup}
            <h4>${escapeHtml(cardData.titulo || "Módulo")}</h4>
            ${textMarkup}
            ${listMarkup}
          `;

          cards.appendChild(card);
        });

        section.appendChild(cards);
      }

      wrapper.appendChild(section);
    });

    return wrapper;
  }

  function createContactsSection(title, items) {
    const section = document.createElement("section");
    section.className = "detail-section";
    const safeItems = Array.isArray(items) ? items : [];

    section.innerHTML = `<h3>${escapeHtml(title)}</h3>`;

    if (safeItems.length === 0) {
      section.insertAdjacentHTML("beforeend", `<p class="muted">Pendiente por completar.</p>`);
      return section;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "contact-list";

    safeItems.forEach(function (item) {
      const card = document.createElement("div");
      card.className = "contact-card";
      const emailMatch = String(item).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      const phoneMatch = String(item).match(/(\+?\d[\d\s-]{6,}\d)/);

      card.insertAdjacentHTML("beforeend", `<p>${escapeHtml(item)}</p>`);

      if (emailMatch) {
        const email = emailMatch[0];
        card.appendChild(createActionLink("Escribir correo", `mailto:${email}`, false));
      }

      if (phoneMatch) {
        const phone = phoneMatch[0].replace(/\s+/g, "");
        card.appendChild(createActionLink("Llamar", `tel:${phone}`, false));
      }

      wrapper.appendChild(card);
    });

    section.appendChild(wrapper);
    return section;
  }

  function createTag(text) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = text;
    return tag;
  }

  function getAppVisual(appId) {
    return APP_VISUALS[appId] || {
      label: "Aplicacion del grupo",
      monogram: "APP",
      accent: "#0f4c5c",
      accentSoft: "#eef3f4",
      glow: "rgba(15, 76, 92, 0.18)"
    };
  }

  function createVisualMarkup(visual, context) {
    const className = context === "detail" ? "detail-emblem" : "card-emblem";

    if (visual.logo) {
      const scale = typeof visual.logoScale === "number" ? visual.logoScale : 1;
      return `
        <div class="${className} ${className}--image" style="--logo-scale:${escapeAttribute(scale)};" aria-hidden="true">
          <img src="${escapeAttribute(visual.logo)}" alt="">
        </div>
      `;
    }

    return `<div class="${className}" aria-hidden="true">${escapeHtml(visual.monogram)}</div>`;
  }

  function getFileExtension(path) {
    const cleanPath = String(path || "").split("#")[0].split("?")[0];
    const parts = cleanPath.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  }

  function describeDocumentType(extension) {
    if (extension === "pdf") {
      return "Vista previa embebida disponible con opcion de descarga.";
    }

    if (extension === "html" || extension === "htm") {
      return "Documento navegable en formato web.";
    }

    if (extension === "docx") {
      return "Documento editable en formato Word.";
    }

    return "Documento asociado a la aplicacion.";
  }

  function showError(container, message) {
    container.innerHTML = `
      <div class="error-state">
        <strong>No se pudo cargar la informacion.</strong>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
