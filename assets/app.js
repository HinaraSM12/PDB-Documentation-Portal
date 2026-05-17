(function () {
  "use strict";

  const CATALOG_PATH = "./data/apps.json";
  const DETAILS_PATH = "./data/apps/";
  const APP_VISUALS = {
    "inverpep": {
      label: "Base de datos AMP",
      monogram: "INV",
      accent: "#0f766e",
      accentSoft: "#ccfbf1",
      glow: "rgba(15, 118, 110, 0.18)"
    },
    "sequence-filter": {
      label: "Patrones y filtros",
      monogram: "SEQ",
      accent: "#2563eb",
      accentSoft: "#dbeafe",
      glow: "rgba(37, 99, 235, 0.18)"
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
      accent: "#db7c0f",
      accentSoft: "#ffedd5",
      glow: "rgba(219, 124, 15, 0.18)"
    },
    "calcampi": {
      label: "Calculo fisicoquimico",
      monogram: "CAL",
      accent: "#c2410c",
      accentSoft: "#ffedd5",
      glow: "rgba(194, 65, 12, 0.18)"
    },
    "pepmultitools": {
      label: "Suite de microservicios",
      monogram: "PMT",
      accent: "#be185d",
      accentSoft: "#fce7f3",
      glow: "rgba(190, 24, 93, 0.18)"
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
            <div class="card-emblem" aria-hidden="true">${escapeHtml(visual.monogram)}</div>
            <p class="card-kicker">${escapeHtml(visual.label)}</p>
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
        <div class="detail-emblem" aria-hidden="true">${escapeHtml(visual.monogram)}</div>
        <div>
          <p class="detail-kicker">${escapeHtml(visual.label)}</p>
          <h2>${escapeHtml(app.nombre || "Aplicacion sin nombre")}</h2>
        </div>
      </div>
      <p>${escapeHtml(app.descripcion || "Informacion en proceso de migracion.")}</p>
    `;

    const mainColumn = document.createElement("div");
    mainColumn.appendChild(createTextSection("Objetivo", app.objetivo));
    mainColumn.appendChild(createTextSection("Uso general", app.uso));
    mainColumn.appendChild(createListSection("Inputs", app.inputs));
    mainColumn.appendChild(createListSection("Outputs", app.outputs));
    mainColumn.appendChild(createExtraSections(app.secciones));
    mainColumn.appendChild(createDocumentsSection(app.documentos));

    const sideColumn = document.createElement("aside");
    sideColumn.className = "info-box";
    sideColumn.appendChild(createContactsSection("Contacto", app.responsables));
    sideColumn.appendChild(createTextSection("Ultima actualizacion", app.ultimaActualizacion));

    const grid = document.createElement("div");
    grid.className = "detail-grid";
    grid.appendChild(mainColumn);
    grid.appendChild(sideColumn);

    container.appendChild(header);
    container.appendChild(grid);
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
      preview.open = true;
      preview.innerHTML = `
        <summary>Visualizar dentro de la app</summary>
        <iframe
          class="pdf-viewer"
          src="${escapeAttribute(`${path}#view=FitH`)}"
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
