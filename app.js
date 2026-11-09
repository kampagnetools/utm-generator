// Linkbygger: motoren. Indstillinger ligger i config.js.
(function () {
  var s = fresh();
  function fresh() {
    return { channel: null, paid: null, format: null, other: "", sourceName: "", qr: null, campaign: null,
      codeOne: "", codeFp: "", codeGift: "",
      useAmounts: null, amtOne: ["", "", ""], amtRec: ["", "", ""],
      url: "", topic: "", mailCampaign: "", step: 0, mode: null };
  }
  function digits(x) { return (x || "").replace(/\D/g, ""); }
  function amountList(arr) { return arr.map(digits).filter(function (a) { return a && +a > 0; }).join(","); }
  function extras() {
    var e = {};
    var am = s.useAmounts && amountsAllowed();
    if (am && amountList(s.amtOne)) e["donation-amounts"] = amountList(s.amtOne);
    if (am && amountList(s.amtRec)) e["donation-amounts-recurring"] = amountList(s.amtRec);
    var one = digits(s.codeOne) || (isEmail() ? DEFAULT_CODE_ONE : "");
    var fp = digits(s.codeFp) || (isEmail() ? DEFAULT_CODE_FP : "");
    if (one) e.campaign_code = one;
    if (fp) e.campaign_code_recurring = fp;
    var gift = digits(s.codeGift);
    if (gift) e.utm_campaign_code = gift;
    return e;
  }
  function isAd() { return isSocial() && s.paid === true; }
  function amountsAllowed() { return isAd() || isGads() || isDisplay() || medium() === "email"; }
  var $ = function (id) { return document.getElementById(id); };

  function clean(x) {
    return (x || "").toLowerCase().trim()
      .replace(/æ/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9_-]+/g, "_").replace(/_+/g, "_").replace(/^[_-]+|[_-]+$/g, "");
  }
  function ch() { return CHANNELS.filter(function (c) { return c.v === s.channel; })[0]; }
  function isSocial() { var c = ch(); return !!(c && c.social); }
  function isPrint() { var c = ch(); return !!(c && c.print); }
  function isGads() { var c = ch(); return !!(c && c.gads); }
  function isDisplay() { var c = ch(); return !!(c && c.display); }
  function isMs() { var c = ch(); return !!(c && c.ms); }
  function medium() {
    var c = ch(); if (!c) return null;
    if (c.social) return s.paid ? "paid-social" : "organic";
    if (c.print) return s.paid ? "print-paid" : "print";
    if (c.display) { var f = FORMATS.display.filter(function (x) { return x.v === s.format; })[0]; return f ? f.m : "display"; }
    if (c.gads) return null;
    return c.medium;
  }
  function formats() {
    var c = ch(); if (!c) return [];
    if (c.social) return s.paid ? (c.v === "linkedin" ? FORMATS.linkedin_paid : FORMATS.meta_paid) : FORMATS[c.v];
    if (c.print) return s.paid ? FORMATS.printPaid : FORMATS.printOwn;
    if (c.display) return FORMATS.display;
    return FORMATS[c.medium] || [];
  }
  function source() {
    if (isDisplay()) return clean(s.sourceName);
    return isPrint() ? (s.format === "__other" ? clean(s.other) : s.format) : s.channel;
  }
  function isEmail() { return medium() === "email"; }
  function campaign() {
    if (s.campaign && s.campaign !== "evergreen") return s.campaign;
    return isEmail() ? (clean(s.mailCampaign) || null) : s.campaign;
  }
  function content() {
    if (isEmail()) return null;
    var t = clean(s.topic), base = isPrint() ? s.qr : s.format;
    return base ? (t ? base + "_" + t : base) : null;
  }

  function steps() {
    var l = ["channel"];
    if (!s.channel || isSocial() || isPrint()) l.push("paid");
    if (!isEmail() && !isGads()) l.push("format");
    if (isDisplay()) l.push("source");
    if (isPrint()) l.push("qr");
    l.push("campaign");
    // Google og Microsoft Ads: ingen landingsside, kun et suffiks med koder
    if (isGads()) l.push("codes", "done");
    else l.push("codes", "url", "done");
    return l;
  }
  function cur() { return steps()[s.step]; }
  function go(i) { s.mode = null; s.step = Math.max(0, Math.min(i, steps().length - 1)); draw(true); window.scrollTo({ top: 0 }); }
  function openAmounts() { s.mode = "amounts"; draw(true); window.scrollTo({ top: 0 }); setTimeout(function () { var i = $("amtOne0"); if (i) i.focus(); }, 0); }
  function closeAmounts() { s.useAmounts = !!(amountList(s.amtOne) || amountList(s.amtRec)); s.mode = null; draw(true); window.scrollTo({ top: 0 }); }
  function next() { go(s.step + 1); }

  function parseUrl(raw) {
    raw = (raw || "").trim();
    if (!raw) return { url: null, err: "" };
    if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    try {
      var u = new URL(raw);
      if (!/(^|\.)msf\.dk$/i.test(u.hostname)) return { url: u, err: "", warn: "Er du sikker på, at linket ikke skal pege på msf.dk?" };
      u.protocol = "https:";
      return { url: u, err: "" };
    } catch (e) { return { url: null, err: "Det ligner ikke en webadresse. Kopiér hele adressen fra browseren." }; }
  }

  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function opt(item, selected, onPick, extra) {
    var b = h("button", "opt" + (selected ? " sel" : "") + (extra ? " " + extra : "")); b.type = "button";
    var tt = h("span", "tt"); tt.appendChild(h("span", "t", item.t));
    if (item.o) tt.appendChild(h("span", "ov", item.o));
    b.appendChild(tt);
    b.appendChild(h("span", "d", item.d || ""));
    b.addEventListener("click", onPick);
    return b;
  }
  function label(key) {
    if (key === "channel") return ch().t;
    if (key === "paid") return isPrint() ? (s.paid ? "Købt plads" : "Egen tryksag") : (s.paid ? "Annonce" : "Organisk");
    if (key === "format") {
      if (s.format === "__other") return clean(s.other);
      var f = formats().filter(function (x) { return x.v === s.format; })[0]; return f ? f.t : "";
    }
    if (key === "source") return clean(s.sourceName);
    if (key === "qr") return s.qr === "qr" ? "QR-kode" : "Trykt link";
    if (key === "campaign") return s.campaign === "evergreen" ? "Ingen kampagne" : campaign();
    if (key === "amounts") {
      var ea = extras(), a = [ea["donation-amounts"], ea["donation-amounts-recurring"]].filter(Boolean);
      return a.length ? "Beløb " + a.join(" · ") : "Standardbeløb";
    }
    if (key === "codes") {
      var ec = extras(), k = [ec.campaign_code, ec.campaign_code_recurring, ec.utm_campaign_code].filter(Boolean);
      return k.length ? "Koder " + k.join("/") : "Ingen koder";
    }
    return "";
  }

  // Viser en adresse eller et suffiks med nøglerne nedtonet
  function codeLine(text, start) {
    var link = h("p", "linkout");
    link.appendChild(document.createTextNode(text.slice(0, start)));
    text.slice(start).split("&").forEach(function (pair, i) {
      if (i) link.appendChild(h("span", "k", "&"));
      var eq = pair.indexOf("=");
      link.appendChild(h("span", "k", pair.slice(0, eq + 1)));
      link.appendChild(document.createTextNode(pair.slice(eq + 1)));
    });
    return link;
  }

  // Kopiér, Samme kampagne ny kanal, Start forfra
  function doneActions(text, link) {
    var acts = h("div", "actions");
    if (text) {
      var cp = h("button", "go", "Kopiér"); cp.type = "button";
      var ok = h("span", "ok", "");
      cp.addEventListener("click", function () {
        var fallback = function () {
          var r = document.createRange(); r.selectNodeContents(link);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
          ok.textContent = "Markeret. Tryk Ctrl+C.";
        };
        try { navigator.clipboard.writeText(text).then(function () { ok.textContent = "Kopieret"; }, fallback); } catch (e) { fallback(); }
      });
      acts.appendChild(cp); acts.appendChild(ok);
    }
    var same = h("button", "small", "Samme kampagne, ny kanal"); same.type = "button";
    same.addEventListener("click", function () { var keep = { campaign: s.campaign, codeOne: s.codeOne, codeFp: s.codeFp, codeGift: s.codeGift,
      useAmounts: s.useAmounts, amtOne: s.amtOne.slice(), amtRec: s.amtRec.slice(), url: s.url, topic: s.topic, mailCampaign: s.mailCampaign }; s = fresh(); Object.assign(s, keep); draw(true); });
    var nw = h("button", "small", "Start forfra"); nw.type = "button";
    nw.addEventListener("click", function () { s = fresh(); draw(true); });
    acts.appendChild(same); acts.appendChild(nw);
    return acts;
  }

  function amountsOption() {
    var more = h("div", "list");
    more.appendChild(opt({ t: s.useAmounts ? "Ret beløbsforslag →" : "Tilføj beløbsforslag →",
      d: s.useAmounts ? label("amounts") : "Egne beløb i donationsformularen" }, false, openAmounts, "more"));
    return more;
  }

  function draw(animate) {
    var st = cur(), all = steps(), total = all.length - 1;
    var stage = $("stage"); stage.innerHTML = "";
    stage.classList.remove("enter"); if (animate) { void stage.offsetWidth; stage.classList.add("enter"); }

    var meta = $("meta"); meta.innerHTML = "";
    if (s.mode === "amounts") meta.textContent = "Ekstra";
    else if (st === "done") meta.textContent = "Færdig";
    else meta.textContent = (s.step + 1) + " / " + total;

    var trail = h("nav", "trail"); trail.setAttribute("aria-label", "Dine valg");
    all.forEach(function (key, i) {
      if ((i >= s.step && !s.mode) || key === "url" || key === "done") return;
      if (trail.childNodes.length) trail.appendChild(h("span", "sep", "/"));
      var b = h("button", null, label(key)); b.type = "button"; b.setAttribute("aria-label", "Ret: " + label(key));
      b.addEventListener("click", function () { go(i); });
      trail.appendChild(b);
    });
    stage.appendChild(trail);

    if (st === "channel") {
      stage.appendChild(h("h1", null, "Hvor skal linket deles?"));
      var l = h("div", "list");
      CHANNELS.forEach(function (c) {
        l.appendChild(opt(c, s.channel === c.v, function () { if (s.channel !== c.v) { s.channel = c.v; s.paid = null; s.format = null; } next(); }));
      });
      stage.appendChild(l);
    }

    if (st === "paid") {
      var pr = isPrint();
      stage.appendChild(h("h1", null, pr ? "Har vi købt pladsen?" : "Betaler vi for at vise det?"));
      var l2 = h("div", "list");
      l2.appendChild(opt(pr ? { t: "Nej", d: "Egne tryksager og outdoor" } : { t: "Nej", d: "Almindeligt opslag" }, s.paid === false, function () { if (s.paid !== false) s.format = null; s.paid = false; next(); }));
      l2.appendChild(opt(pr ? { t: "Ja", d: "Annonce eller indstik i avis og magasin" } : { t: "Ja", d: "Annonce eller boost" }, s.paid === true, function () { if (s.paid !== true) s.format = null; s.paid = true; next(); }));
      stage.appendChild(l2);
    }

    if (st === "format") {
      var head = isDisplay() ? "Hvilken type annonce?" : isPrint() ? (s.paid ? "Hvilket medie?" : "Hvilken tryksag?") : "Hvad slags " + (isSocial() ? (s.paid ? "annonce" : "opslag") : "indhold") + "?";
      stage.appendChild(h("h1", null, head));
      var l3 = h("div", "list");
      formats().forEach(function (f) {
        l3.appendChild(opt(f, s.format === f.v, function () {
          s.format = f.v;
          if (f.v === "__other") { draw(false); var oi = $("other"); if (oi) oi.focus(); } else next();
        }));
      });
      stage.appendChild(l3);
      if (s.format === "__other") {
        var fo = h("div", "form"), ff = h("div", "field");
        var ol = h("label", null, "Mediets navn"); ol.htmlFor = "other";
        var oin = document.createElement("input"); oin.id = "other"; oin.type = "text"; oin.placeholder = "Samvirke"; oin.autocomplete = "off"; oin.value = s.other;
        var ob = h("button", "go", "Videre"); ob.type = "button";
        function updO() { ob.disabled = !clean(oin.value); }
        oin.addEventListener("input", function () { s.other = oin.value; updO(); });
        oin.addEventListener("keydown", function (e) { if (e.key === "Enter" && clean(oin.value)) next(); });
        ob.addEventListener("click", next);
        ff.appendChild(ol); ff.appendChild(oin);
        fo.appendChild(ff); fo.appendChild(ob);
        stage.appendChild(fo); updO();
      }
    }

    if (st === "source") {
      stage.appendChild(h("h1", null, "Hvor kører annoncen?"));
      stage.appendChild(h("p", "sub", "Netværk eller medie, f.eks. adform, dv360, politiken eller podimo. Skriv det samme hver gang."));
      var fs = h("div", "form"), fsf = h("div", "field");
      var sl = h("label", null, "Netværk eller medie"); sl.htmlFor = "src";
      var sin = document.createElement("input"); sin.id = "src"; sin.type = "text"; sin.placeholder = "adform"; sin.autocomplete = "off"; sin.value = s.sourceName;
      var sb = h("button", "go", "Videre"); sb.type = "button";
      function updS() { sb.disabled = !clean(sin.value); }
      sin.addEventListener("input", function () { s.sourceName = sin.value; updS(); });
      sin.addEventListener("keydown", function (e) { if (e.key === "Enter" && clean(sin.value)) next(); });
      sb.addEventListener("click", next);
      fsf.appendChild(sl); fsf.appendChild(sin);
      fs.appendChild(fsf); fs.appendChild(sb);
      stage.appendChild(fs); updS();
      setTimeout(function () { sin.focus(); }, 0);
    }

    if (st === "qr") {
      stage.appendChild(h("h1", null, "Hvordan kommer folk ind på siden?"));
      var lq = h("div", "list");
      lq.appendChild(opt({ t: "QR-kode", d: "Koden scannes" }, s.qr === "qr", function () { s.qr = "qr"; next(); }));
      lq.appendChild(opt({ t: "Trykt link", d: "Adressen skrives af" }, s.qr === "link", function () { s.qr = "link"; next(); }));
      stage.appendChild(lq);
    }

    if (st === "campaign") {
      stage.appendChild(h("h1", null, "Hører det til en kampagne?"));
      stage.appendChild(h("p", "sub", "Samme kampagne i alle kanaler, så den kan ses samlet."));
      var l4 = h("div", "list");
      CAMPAIGNS.forEach(function (c) {
        l4.appendChild(opt(c, s.campaign === c.v, function () { s.campaign = c.v; next(); }));
      });
      stage.appendChild(l4);
    }

    if (st === "codes" || s.mode === "amounts") {
      function numField(id, text, get, set, max, ph, onEnter) {
        var fd = h("div", "field");
        var lbl = h("label", null, text); lbl.htmlFor = id;
        var ci = document.createElement("input"); ci.id = id; ci.type = "text"; ci.inputMode = "numeric"; ci.autocomplete = "off";
        ci.placeholder = ph; ci.maxLength = max; ci.value = get();
        ci.addEventListener("input", function () { var d = digits(ci.value).slice(0, max); if (d !== ci.value) ci.value = d; set(d); });
        ci.addEventListener("keydown", function (e) { if (e.key === "Enter") (onEnter || next)(); });
        fd.appendChild(lbl); fd.appendChild(ci);
        return fd;
      }
      function amountRow(title, key, idp, ph) {
        var fd = h("div", "field");
        fd.appendChild(h("label", null, title));
        var row = h("div", "amounts");
        [0, 1, 2].forEach(function (i) {
          var ai = document.createElement("input"); ai.id = idp + i; ai.type = "text"; ai.inputMode = "numeric"; ai.autocomplete = "off";
          ai.placeholder = ph[i]; ai.maxLength = 6; ai.value = s[key][i];
          ai.setAttribute("aria-label", title + ", beløb " + (i + 1));
          ai.addEventListener("input", function () { var d = digits(ai.value).slice(0, 6); if (d !== ai.value) ai.value = d; s[key][i] = d; });
          ai.addEventListener("keydown", function (e) { if (e.key === "Enter") next(); });
          var cell = h("div", "amt"); cell.appendChild(ai); cell.appendChild(h("span", null, "kr."));
          var wrap = h("div", "amtcell"); wrap.appendChild(cell); wrap.appendChild(h("small", null, ["Lav", "Optimal", "Høj"][i]));
          row.appendChild(wrap);
        });
        fd.appendChild(row);
        return fd;
      }


      if (s.mode === "amounts") {
        stage.appendChild(h("h1", null, "Beløbsforslag"));
        stage.appendChild(h("p", "sub", "Overskriver beløbene i donationsformularen. Tomme felter springes over."));
        var fa = h("div", "form");
        fa.appendChild(amountRow("One-off", "amtOne", "amtOne", ["150", "300", "500"]));
        fa.appendChild(amountRow("Fast, pr. måned", "amtRec", "amtRec", ["100", "150", "200"]));
        var acts2 = h("div", "actions");
        var up = h("button", "go", isGads() ? "Opdater suffiks" : "Opdater link"); up.type = "button";
        up.addEventListener("click", closeAmounts);
        acts2.appendChild(up);
        if (s.useAmounts) {
          var rm = h("button", "small", "Fjern beløbsforslag"); rm.type = "button";
          rm.addEventListener("click", function () { s.amtOne = ["", "", ""]; s.amtRec = ["", "", ""]; closeAmounts(); });
          acts2.appendChild(rm);
        }
        fa.appendChild(acts2);
        stage.appendChild(fa);
      }

      if (st === "codes" && !s.mode) {
        stage.appendChild(h("h1", null, "Kampagnekoder"));
        stage.appendChild(h("p", "sub", isEmail() ? "Udfyld dem, der skal med. Tomme felter til One-off og Feltpartner får standardkoden." : "Udfyld dem, der skal med. Tomme felter kommer ikke med i linket."));
        var fk = h("div", "form");
        var warn = h("p", "err"); warn.hidden = true;
        var nk = h("button", "go", "Videre"); nk.type = "button";
        var nb = h("button", "small", "Tilbage til koderne"); nb.type = "button"; nb.hidden = true;
        var warned = false;
        function resetWarn() { warned = false; warn.hidden = true; nb.hidden = true; nk.textContent = "Videre"; }
        // Spørg én gang, før vi går videre:
        // SFMC: One-off eller Feltpartner er tom, så standardkoden bruges.
        // Andre kanaler: ingen koder overhovedet.
        function submitCodes() {
          var msg = "";
          if (isEmail()) {
            var d = [];
            if (!digits(s.codeOne)) d.push("One-off " + DEFAULT_CODE_ONE);
            if (!digits(s.codeFp)) d.push("Feltpartner " + DEFAULT_CODE_FP);
            if (d.length) msg = "Intet er valgt" + (d.length === 1 ? " for " + d[0].split(" ")[0] : "") + (d.length === 1 ? ". Standardkampagnekoden er valgt: " : ". Standardkampagnekoderne er valgt: ") + d.join(" og ") + ". Er du sikker på, at det er rigtigt?";
          } else if (!digits(s.codeOne) && !digits(s.codeFp) && !digits(s.codeGift)) {
            msg = "Du har hverken valgt kampagnekode One-off, Feltpartner eller gavebevis. Er du sikker på, at det er rigtigt?";
          }
          if (msg && !warned) {
            warned = true; warn.hidden = false; nb.hidden = false; nk.textContent = "Ja, videre";
            warn.textContent = msg;
            return;
          }
          next();
        }
        fk.appendChild(numField("codeOne", "Kampagnekode One-off", function () { return s.codeOne; }, function (v) { s.codeOne = v; resetWarn(); }, 4, isEmail() ? "Hvis ingen valgt: " + DEFAULT_CODE_ONE : "Indtast kampagnekode", submitCodes));
        fk.appendChild(numField("codeFp", "Kampagnekode Feltpartner", function () { return s.codeFp; }, function (v) { s.codeFp = v; resetWarn(); }, 4, isEmail() ? "Hvis ingen valgt: " + DEFAULT_CODE_FP : "Indtast kampagnekode", submitCodes));
        fk.appendChild(numField("codeGift", "Kampagnekode gavebevis", function () { return s.codeGift; }, function (v) { s.codeGift = v; resetWarn(); }, 4, "Hvis ingen valgt, kommer den ikke med", submitCodes));
        fk.appendChild(warn);
        var ka = h("div", "actions");
        nk.addEventListener("click", submitCodes);
        nb.addEventListener("click", function () { resetWarn(); $("codeOne").focus(); });
        ka.appendChild(nk); ka.appendChild(nb);
        fk.appendChild(ka);
        stage.appendChild(fk);
        setTimeout(function () { var i = $("codeOne"); if (i) i.focus(); }, 0);
      }
    }

    if (st === "url") {
      stage.appendChild(h("h1", null, "Hvor skal brugeren lande?"));
      var fm2 = h("div", "form");
      var f1 = h("div", "field");
      var ul = h("label", null, "Side på MSF.DK. Kopiér adressen fra browseren."); ul.htmlFor = "url";
      var u = document.createElement("input"); u.id = "url"; u.type = "url"; u.placeholder = "msf.dk/stoet"; u.autocomplete = "off"; u.spellcheck = false; u.value = s.url;
      var err = h("p", "err"); err.hidden = true;
      f1.appendChild(ul); f1.appendChild(u); f1.appendChild(err);
      var f2 = h("div", "field");
      var mail = isEmail() && s.campaign === "evergreen", tkey = mail ? "mailCampaign" : "topic";
      var tl = h("label", null, mail ? "Kampagne, valgfrit" : "Emne, valgfrit"); tl.htmlFor = tkey;
      var t = document.createElement("input"); t.id = tkey; t.type = "text"; t.placeholder = mail ? "Gaza" : "Sudan"; t.autocomplete = "off"; t.value = s[tkey];
      f2.appendChild(tl); f2.appendChild(t);
      var mk = h("button", "go", "Lav link"); mk.type = "button";
      var warned = false;
      function reset() { warned = false; err.hidden = true; mk.textContent = "Lav link"; mk.disabled = !u.value.trim(); }
      function submit() {
        var p = parseUrl(u.value);
        if (p.err) { err.textContent = p.err; err.hidden = false; return; }
        if (p.warn && !warned) { warned = true; err.textContent = p.warn; err.hidden = false; mk.textContent = "Ja, lav link"; return; }
        next();
      }
      u.addEventListener("input", function () { s.url = u.value; reset(); });
      t.addEventListener("input", function () { s[tkey] = t.value; });
      [u, t].forEach(function (el) { el.addEventListener("keydown", function (e) { if (e.key === "Enter" && !mk.disabled) submit(); }); });
      mk.addEventListener("click", submit);
      fm2.appendChild(f1); if (mail || !isEmail()) fm2.appendChild(f2); fm2.appendChild(mk);
      stage.appendChild(fm2);
      reset();
      setTimeout(function () { u.focus(); }, 0);
    }

    // Google Ads: ingen UTM-koder (gclid klarer det), kun kampagnekoder.
    // Microsoft Ads: UTM-koder + kampagnekoder, så utm_campaign er den samme som i de andre kanaler.
    if (st === "done" && !s.mode && isGads()) {
      var gcodes = extras(), gparts = [];
      if (isMs()) {
        gparts.push("utm_source=bing", "utm_medium=cpc", "utm_campaign=" + campaign(),
          "utm_content={AdGroup}", "utm_term={keyword}");
      }
      Object.keys(gcodes).forEach(function (k) { gparts.push(k + "=" + gcodes[k]); });
      var suffix = gparts.join("&");

      if (suffix) {
        stage.appendChild(h("h1", null, "Dit suffiks er klar."));
        stage.appendChild(h("p", "sub", isMs()
          ? "Microsoft fylder selv annoncegruppe og søgeord ind i {AdGroup} og {keyword}."
          : "Ingen UTM-koder. Google Ads giver GA4 kilde og kampagne via auto-tagging."));
        var sline = codeLine(suffix, 0);
        stage.appendChild(sline);
        stage.appendChild(doneActions(suffix, sline));
      } else {
        stage.appendChild(h("h1", null, "Der skal ikke sættes noget på."));
        stage.appendChild(h("p", "sub", "Uden kampagnekoder klarer auto-tagging det hele. Sæt ingen UTM-koder på annoncerne."));
        stage.appendChild(doneActions("", null));
      }

      if (amountsAllowed()) stage.appendChild(amountsOption());

      var gc = h("div", "cols");
      var g1 = h("div");
      if (isMs()) {
        g1.appendChild(h("h2", null, "Sådan i Microsoft Ads"));
        g1.appendChild(h("p", "sub", "Sæt suffikset på kampagnen under Kampagnewebadresse > Endelig webadresse-suffiks."));
        var g2 = h("div"); g2.appendChild(h("h2", null, "Tjek kontoindstillinger > Auto-tagging"));
        g2.appendChild(h("p", "sub", "Microsoft Click ID (msclkid): slået til. UTM-tags: Erstat ikke eksisterende UTM-tags."));
        gc.appendChild(g1); gc.appendChild(g2);
      } else {
        g1.appendChild(h("h2", null, "Sådan i Google Ads"));
        g1.appendChild(h("p", "sub", "Kampagne > Indstillinger > Indstillinger for kampagnewebadresse > Endelig webadresse-suffiks. Virker for Søg, Display, YouTube og Demand Gen."));
        var g3 = h("div"); g3.appendChild(h("h2", null, "Tjek"));
        g3.appendChild(h("p", "sub", "Automatisk tagging er slået til. Der står ingen utm_-koder i suffikser eller sporingsskabeloner."));
        gc.appendChild(g1); gc.appendChild(g3);
      }
      stage.appendChild(gc);
    }

    if (st === "done" && !s.mode && !isGads()) {
      var p = parseUrl(s.url).url;
      var vals = { utm_source: source(), utm_medium: medium(), utm_campaign: campaign(), utm_content: content() };
      Object.keys(vals).forEach(function (k) { if (!vals[k]) delete vals[k]; });
      var codes = extras();
      Object.keys(codes).forEach(function (k) { p.searchParams.set(k, codes[k]); });
      Object.keys(vals).forEach(function (k) { p.searchParams.set(k, vals[k]); });
      Object.keys(codes).forEach(function (k) { vals[k] = codes[k]; });
      var href = p.toString().replace(/%2C/gi, ",");

      stage.appendChild(h("h1", null, "Dit link er klar."));
      var link = codeLine(href, href.indexOf("?") + 1);
      stage.appendChild(link);
      stage.appendChild(doneActions(href, link));

      if (amountsAllowed()) stage.appendChild(amountsOption());

      var cols = h("div", "cols");
      var c1 = h("div"); c1.appendChild(h("h2", null, "Koderne"));
      var dl = h("dl", "parts");
      Object.keys(vals).forEach(function (k) { dl.appendChild(h("dt", null, k)); dl.appendChild(h("dd", null, vals[k])); });
      c1.appendChild(dl); cols.appendChild(c1);
      if (isSocial() && s.paid) {
        var c2 = h("div"); c2.appendChild(h("h2", null, "Annonce i Ads Manager? Sæt dette under URL-parametre"));
        var adsParams = "utm_source=" + s.channel + "&utm_medium=paid-social&utm_campaign=" + campaign() + "&utm_content={{ad.name}}"
          + (s.channel === "linkedin" ? "" : "&utm_term={{placement}}");
        Object.keys(codes).forEach(function (k) { adsParams += "&" + k + "=" + codes[k]; });
        c2.appendChild(h("p", "adscode", adsParams));
        cols.appendChild(c2);
      }
      if (isDisplay()) {
        var c4 = h("div"); c4.appendChild(h("h2", null, "Bruges i Google Ads?"));
        c4.appendChild(h("p", "sub", "Så skal du ikke bruge dette link. Vælg Google Ads eller Microsoft Ads i stedet."));
        cols.appendChild(c4);
      }
      if (isPrint() && s.qr === "link") {
        var c3 = h("div"); c3.appendChild(h("h2", null, "Trykt link? Lav en kort adresse"));
        c3.appendChild(h("p", "sub", "Tryk en kort adresse, fx msf.dk/" + (campaign() && campaign() !== "evergreen" ? campaign() : "jul26") + ", og lad den videresende til linket ovenfor. Brug en ny kort adresse til hver udsendelse."));
        cols.appendChild(c3);
      }
      stage.appendChild(cols);
    }

    if (s.step > 0) {
      var back = h("button", "back", "Tilbage"); back.type = "button";
      back.addEventListener("click", function () {
        if (s.mode) { s.mode = null; draw(true); }
        else go(s.step - 1);
      });
      stage.appendChild(back);
    }
  }


  var T = window.linkbyggerTheme, NAMES = { auto: "Auto", light: "Lys", dark: "Mørk" }, ORDER = ["auto", "light", "dark"];
  function themeLabel() { $("theme").textContent = "Tema: " + NAMES[T.pref()]; }
  $("theme").addEventListener("click", function () {
    var nextPref = ORDER[(ORDER.indexOf(T.pref()) + 1) % ORDER.length];
    T.save(nextPref); T.apply(); themeLabel();
  });
  themeLabel();

  draw(false);
})();
