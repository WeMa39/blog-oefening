// ============================================================
// Blogs van Mind your Life, rechtstreeks uit een Google-spreadsheet
// ============================================================
//
// Hoe het werkt, in 4 stappen:
//   1. We halen het CSV-bestand op via de publicatielink van het blad.
//   2. We knippen die tekst in rijen en kolommen.
//   3. We sorteren de blogs: de nieuwste eerst.
//   4. Van elke rij maken we een blogkaartje op de pagina.

// De publicatielink van je Google-spreadsheet (stap 2 van vandaag).
const CSV_LINK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRx_-6CvMkk83HM6s26m9OxM1KVkyxnjhACbuZSZVn3VcIyB6nHBlt6utYIs4tv-x8YdDphbbTIp56G/pub?gid=0&single=true&output=csv";

// De plek in blog.html waar de blogs moeten verschijnen.
const plek = document.getElementById("blogs");

// ------------------------------------------------------------
// Stap 1: het CSV-bestand ophalen
// ------------------------------------------------------------
// fetch() vraagt het bestand op bij Google. Dat duurt even,
// daarom gebruiken we "then": "als het binnen is, doe dan ...".
fetch(CSV_LINK)
  .then(function (antwoord) {
    return antwoord.text();
  })
  .then(function (csvTekst) {
    const rijen = leesCsv(csvTekst);
    const blogs = maakBlogs(rijen);
    toonBlogs(blogs);
  })
  .catch(function () {
    plek.textContent = "De blogs konden niet geladen worden. Probeer het later opnieuw.";
  });

// ------------------------------------------------------------
// Stap 2: CSV-tekst omzetten naar rijen en kolommen
// ------------------------------------------------------------
// Een CSV-bestand scheidt kolommen met komma's en rijen met een nieuwe regel.
// Maar: staat er een komma of een nieuwe regel IN een tekst, dan zet
// Google die tekst tussen aanhalingstekens. En een aanhalingsteken in de
// tekst wordt dubbel geschreven (""). Daarom lopen we teken per teken door
// de tekst en onthouden we of we "binnen aanhalingstekens" zitten.
function leesCsv(tekst) {
  const rijen = [];
  let rij = [];
  let cel = "";
  let binnenQuotes = false;

  for (let i = 0; i < tekst.length; i++) {
    const teken = tekst[i];

    if (binnenQuotes) {
      if (teken === '"' && tekst[i + 1] === '"') {
        cel += '"';           // "" betekent een gewoon aanhalingsteken
        i++;                  // het tweede teken overslaan
      } else if (teken === '"') {
        binnenQuotes = false; // einde van de tekst tussen aanhalingstekens
      } else {
        cel += teken;         // komma's en nieuwe regels horen hier gewoon bij de tekst
      }
    } else {
      if (teken === '"') {
        binnenQuotes = true;
      } else if (teken === ",") {
        rij.push(cel);        // einde van een kolom
        cel = "";
      } else if (teken === "\n") {
        rij.push(cel);        // einde van een rij
        rijen.push(rij);
        rij = [];
        cel = "";
      } else if (teken !== "\r") {
        cel += teken;
      }
    }
  }
  // De laatste rij heeft vaak geen nieuwe regel op het einde.
  if (cel !== "" || rij.length > 0) {
    rij.push(cel);
    rijen.push(rij);
  }
  return rijen;
}

// ------------------------------------------------------------
// Stap 3: rijen omzetten naar blogs, de nieuwste eerst
// ------------------------------------------------------------
// De eerste rij bevat de kolomnamen (titel, datum, tekst). Zo weten we
// in welke kolom wat staat, ook als iemand de kolommen van plaats wisselt.
function maakBlogs(rijen) {
  const kolomnamen = rijen[0].map(function (naam) {
    return naam.trim().toLowerCase();
  });
  const kolomTitel = kolomnamen.indexOf("titel");
  const kolomDatum = kolomnamen.indexOf("datum");
  const kolomTekst = kolomnamen.indexOf("tekst");

  const blogs = [];
  for (let i = 1; i < rijen.length; i++) {
    const rij = rijen[i];
    const titel = (rij[kolomTitel] || "").trim();
    if (titel === "") continue; // lege rijen overslaan

    blogs.push({
      titel: titel,
      datum: leesDatum(rij[kolomDatum]),
      tekst: rij[kolomTekst] || ""
    });
  }

  // Sorteren: de blog met de grootste (= recentste) datum eerst.
  blogs.sort(function (a, b) {
    return b.datum - a.datum;
  });
  return blogs;
}

// Zet "23/07/2024" om naar een echte datum waarmee JavaScript kan rekenen.
function leesDatum(tekst) {
  const delen = (tekst || "").trim().split("/");
  if (delen.length !== 3) return new Date(0);
  const dag = Number(delen[0]);
  const maand = Number(delen[1]) - 1; // in JavaScript is januari maand 0
  const jaar = Number(delen[2]);
  return new Date(jaar, maand, dag);
}

// Zet een datum om naar "23 juli 2024".
function mooieDatum(datum) {
  return datum.toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });
}

// ------------------------------------------------------------
// Stap 4: van elke blog een kaartje maken
// ------------------------------------------------------------
// We bouwen de HTML met createElement en textContent. textContent zet
// tekst altijd als gewone tekst neer, nooit als code. Zo kan er via de
// spreadsheet nooit per ongeluk iets op de site belanden dat de pagina breekt.
function toonBlogs(blogs) {
  plek.textContent = ""; // de tekst "Blogs worden geladen..." weghalen

  if (blogs.length === 0) {
    plek.textContent = "Er staan nog geen blogs online.";
    return;
  }

  blogs.forEach(function (blog) {
    const kaartje = document.createElement("article");
    kaartje.className = "blog-kaartje";

    const titel = document.createElement("h2");
    titel.textContent = blog.titel;
    kaartje.appendChild(titel);

    const datum = document.createElement("p");
    datum.className = "blog-datum";
    datum.textContent = mooieDatum(blog.datum);
    kaartje.appendChild(datum);

    // Elke regel uit de cel wordt een aparte alinea.
    const alineas = blog.tekst.split("\n").filter(function (regel) {
      return regel.trim() !== "";
    });

    // De eerste twee alinea's tonen we meteen, de rest na "Lees verder".
    const rest = document.createElement("div");
    rest.hidden = true;

    alineas.forEach(function (regel, nummer) {
      const p = document.createElement("p");
      p.textContent = regel;
      if (nummer < 2) {
        kaartje.appendChild(p);
      } else {
        rest.appendChild(p);
      }
    });
    kaartje.appendChild(rest);

    if (alineas.length > 2) {
      const knop = document.createElement("button");
      knop.className = "blog-knop";
      knop.textContent = "Lees verder";
      knop.addEventListener("click", function () {
        rest.hidden = !rest.hidden;
        knop.textContent = rest.hidden ? "Lees verder" : "Minder tonen";
      });
      kaartje.appendChild(knop);
    }

    plek.appendChild(kaartje);
  });
}
