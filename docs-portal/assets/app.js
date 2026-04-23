(function () {
  "use strict";

  const CATALOG_PATH = "./data/apps.json";
  const DETAILS_PATH = "./data/apps/";

  document.addEventListener("DOMContentLoaded", function () {
    const page = document.body.dataset.page;

    if (page === "home") {
      initHomePage();
    }

    if (page === "detail") {
      initDetailPage();
    }
  });

  // Carga el catálogo general y activa el filtro local.
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
      showError(listElement, "No fue posible cargar el catálogo de aplicaciones.");
      countElement.textContent = "Catálogo no disponible";
    }
  }

  // Lee el parámetro ?app= y carga el JSON de detalle correspondiente.
  async function initDetailPage() {
    const detailElement = document.getElementById("app-detail");
    const params = new URLSearchParams(window.location.search);
    const appId = params.get("app");

    if (!appId) {
      showError(detailElement, "No se indicó una aplicación para consultar.");
      return;
    }

    try {
      const app = await fetchJson(`${DETAILS_PATH}${encodeURIComponent(appId)}.json`);
      renderAppDetail(app, detailElement);
      document.title = `${app.nombre || "Aplicación"} | Portal de Documentación`;
    } catch (error) {
      showError(
        detailElement,
        "No fue posible cargar la ficha de esta aplicación. Verifica que el enlace sea correcto."
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
      const card = document.createElement("article");
      card.className = "app-card";

      const metadata = document.createElement("div");
      metadata.className = "meta-row";

      if (app.responsable) {
        metadata.appendChild(createTag(app.responsable));
      }

      if (app.estado) {
        metadata.appendChild(createTag(app.estado));
      }

      card.innerHTML = `
        <div>
          <h3>${escapeHtml(app.nombre || "Aplicación sin nombre")}</h3>
          <p class="muted">${escapeHtml(app.descripcion || "Información en proceso de migración.")}</p>
        </div>
      `;

      card.querySelector("div").appendChild(metadata);
      card.insertAdjacentHTML(
        "beforeend",
        `<a class="button" href="./app.html?app=${encodeURIComponent(app.id)}">Ver detalle</a>`
      );

      container.appendChild(card);
    });
  }

  function renderAppDetail(app, container) {
    container.innerHTML = "";

    const header = document.createElement("header");
    header.className = "detail-header";
    header.innerHTML = `
      <h2>${escapeHtml(app.nombre || "Aplicación sin nombre")}</h2>
      <p>${escapeHtml(app.descripcion || "Información en proceso de migración.")}</p>
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
    sideColumn.appendChild(createListSection("Responsables", app.responsables));
    sideColumn.appendChild(createTextSection("Última actualización", app.ultimaActualizacion));

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
        `<p class="muted">No hay documentos cargados todavía.</p>`
      );
      return section;
    }

    const list = document.createElement("ul");
    list.className = "documents-list";

    safeDocuments.forEach(function (documentInfo) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = documentInfo.archivo || documentInfo.url || "#";
      link.textContent = documentInfo.titulo || documentInfo.nombre || "Documento sin nombre";

      item.appendChild(link);

      if (documentInfo.descripcion) {
        item.appendChild(document.createTextNode(` - ${documentInfo.descripcion}`));
      }

      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
  }

  function createExtraSections(sections) {
    const wrapper = document.createElement("div");
    const safeSections = Array.isArray(sections) ? sections : [];

    safeSections.forEach(function (sectionData) {
      const section = document.createElement("section");
      section.className = "detail-section";

      section.innerHTML = `<h3>${escapeHtml(sectionData.titulo || "Información adicional")}</h3>`;

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

  function createTag(text) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = text;
    return tag;
  }

  function showError(container, message) {
    container.innerHTML = `
      <div class="error-state">
        <strong>No se pudo cargar la información.</strong>
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
})();
