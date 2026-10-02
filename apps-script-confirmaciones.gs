/**
 * Google Apps Script para recibir las confirmaciones de Confirmar.astro
 * (boda David y Dina)
 *
 * CÓMO USARLO
 * 1. Crea un Google Sheet nuevo -> Extensiones -> Apps Script.
 * 2. Borra todo y pega este código. Guarda.
 * 3. Implementar -> Nueva implementación -> Tipo: Aplicación web
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: CUALQUIER USUARIO  <-- importante
 *    Google pide autorizar: "Configuración avanzada" -> "Ir a (no seguro)" -> Permitir.
 * 4. Copia la URL que termina en /exec y pégala en SCRIPT_URL dentro de
 *    src/components/Confirmar.astro.
 *
 * OJO: si después editas este script, en "Administrar implementaciones" ->
 * editar -> Versión: Nueva. Así los cambios se aplican a la MISMA URL.
 */

var NOMBRE_HOJA = "Confirmaciones";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // evita que dos invitados escriban en la misma fila

  try {
    var libro = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = libro.getSheetByName(NOMBRE_HOJA) || libro.insertSheet(NOMBRE_HOJA);

    // encabezados la primera vez
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(["#", "Nombre", "Asistencia", "Fecha"]);
      hoja.getRange(1, 1, 1, 4).setFontWeight("bold");
      hoja.setFrozenRows(1);
    }

    var p = (e && e.parameter) || {};
    var nombre = String(p.nombre || "").trim();
    var asistencia = p.asistencia === "si" ? "Asistirá" : "No asistirá";

    if (!nombre) {
      return respuesta({ ok: false, error: "nombre vacio" });
    }

    var numero = hoja.getLastRow(); // fila 1 = encabezado, así queda 1, 2, 3...
    var fecha = Utilities.formatDate(new Date(), "America/La_Paz", "dd/MM/yyyy HH:mm");

    hoja.appendRow([numero, nombre, asistencia, fecha]);

    return respuesta({ ok: true });
  } catch (error) {
    return respuesta({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

/** Abrir la URL /exec en el navegador muestra cuántos respondieron. */
function doGet() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMBRE_HOJA);
  var total = hoja ? Math.max(0, hoja.getLastRow() - 1) : 0;
  return respuesta({ ok: true, respuestas: total });
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON
  );
}
