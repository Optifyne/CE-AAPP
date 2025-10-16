/*******************************************************************************
 *     Copyright (c) 2023 TriggerReactor Team
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var Paths = Java.type("java.nio.file.Paths");
var Files = Java.type("java.nio.file.Files");
var StandardCharsets = Java.type("java.nio.charset.StandardCharsets");
var LocalDate = Java.type('java.time.LocalDate');
var DateTimeFormatter = Java.type('java.time.format.DateTimeFormatter');
var URL = Java.type('java.net.URL');
var BufferedReader = Java.type('java.io.BufferedReader');
var InputStreamReader = Java.type('java.io.InputStreamReader');
var URI = Java.type('java.net.URI');
var Duration = Java.type('java.time.Duration');
var HttpClient = Java.type('java.net.http.HttpClient');
var HttpRequest = Java.type('java.net.http.HttpRequest');
var HttpResponse = Java.type('java.net.http.HttpResponse');

function compareSemVer(a, b) {
    var ax = String(a).split('.');
    var bx = String(b).split('.');
    var n = Math.max(ax.length, bx.length);
    for (var i = 0; i < n; i++) {
        var xi = i < ax.length ? parseInt(ax[i].replace(/\D/g, ''), 10) || 0 : 0;
        var yi = i < bx.length ? parseInt(bx[i].replace(/\D/g, ''), 10) || 0 : 0;
        if (xi !== yi) return xi > yi ? 1 : -1;
    }
    return 0;
}

function httpGet(url) {
    try {
        var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();
        var req = HttpRequest.newBuilder(URI.create(String(url)))
            .timeout(Duration.ofSeconds(6))
            .header('User-Agent', 'Nashorn-UpdateChecker')
            .build();
        var resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        var code = resp.statusCode();
        if (code !== 200) throw new Error('HTTP ' + code);
        return String(resp.body());
    } catch (e) {
        var conn = new URL(String(url)).openConnection();
        conn.setRequestProperty('User-Agent', 'Nashorn-UpdateChecker');
        conn.setConnectTimeout(4000);
        conn.setReadTimeout(6000);

        var code2 = conn.getResponseCode ? conn.getResponseCode() : 200;
        if (code2 !== 200) throw new Error('HTTP ' + code2);

        var br = new BufferedReader(new InputStreamReader(conn.getInputStream(), 'UTF-8'));
        var sb = '', line;
        while ((line = br.readLine()) !== null) sb += line + '\n';
        br.close();
        return sb;
    }
}

function majorFromVersionString(v) {
    var parts = String(v).split('.');
    if (parts.length >= 2) return parts[0] + "." + parts[1];
    if (parts.length === 1) return parts[0];
    return "0.0";
}

function parseDateFlexible(s) {
    var str = String(s).trim();
    try { return LocalDate.parse(str); } catch (e) {}

    try {
        var DMY = DateTimeFormatter.ofPattern('dd.MM.yyyy');
        return LocalDate.parse(str, DMY);
    } catch (e2) {}

    throw new Error("unsupported date format: " + str);
}

function readCurrentVersionFromFile() {
    var path = Paths.get("plugins/TriggerReactor/version.json");
    if (!Files.exists(path)) {
        throw new Error("version.json not found at " + path.toString());
    }
    var text = new java.lang.String(Files.readAllBytes(path), StandardCharsets.UTF_8);
    var j = JSON.parse(String(text));

    var currentMajor = null;
    if (j.major) currentMajor = String(j.major);
    else if (j.version) currentMajor = majorFromVersionString(j.version);
    else throw new Error("version.json: missing 'major' or 'version'");

    var dateRaw = j.build_date || j.buildDate || j.date;
    if (!dateRaw) throw new Error("version.json: missing 'build_date' / 'buildDate' / 'date'");
    var ld = parseDateFlexible(String(dateRaw));

    return {
        currentMajor: currentMajor,
        currentBuildIsoDate: String(ld)
    };
}

function buildUpdateMessage(currentMajor, currentBuildIsoDate,
                            latestMajor, latestBuildIsoDate, downloadUrl, changelogUrl) {
    var msg = "§e[CEAAPP]§r §fNew version available: §c" + latestMajor +
          " §7from §f" + latestBuildIsoDate + "§7. §fYour version: " +
          "§a" + currentMajor + " §7(§f" + currentBuildIsoDate + "§7)§f.";
    if (downloadUrl) msg += " §7Download: §9" + downloadUrl + "§r";
    if (changelogUrl) msg += " §7Changes: §9" + changelogUrl + "§r";
    return msg;
}

function CEcheckUpdatesActivator(args) {
    var jsonUrl = args[0];
    
    try {
        var cur = readCurrentVersionFromFile();
        var currentMajor = cur.currentMajor;
        var currentBuildIsoDate = cur.currentBuildIsoDate;

        var body = httpGet(jsonUrl);
        var j = JSON.parse(String(body));

        var latestMajor = String(j.major);
        var latestDate = LocalDate.parse(String(j.build_date));
        var currentDate = LocalDate.parse(String(currentBuildIsoDate));

        var outdated = (compareSemVer(latestMajor, String(currentMajor)) > 0) ||
                       (latestMajor === String(currentMajor) && latestDate.isAfter(currentDate));

        if (outdated) {
            var msg = buildUpdateMessage(
                currentMajor, currentBuildIsoDate,
                latestMajor, String(latestDate),
                j.download || null,
                j.changelog || null
            );
            Bukkit.getConsoleSender().sendMessage("");
            Bukkit.getConsoleSender().sendMessage(msg);
            Bukkit.getConsoleSender().sendMessage("");
        } else {
            Bukkit.getConsoleSender().sendMessage("");
			Bukkit.getConsoleSender().sendMessage(
                "§e[CEAAPP]§r §fCurrent version is up to date: §a" + currentMajor + " §7(§f" + currentBuildIsoDate + "§7)§f."
            );
            Bukkit.getConsoleSender().sendMessage("");
        }
    } catch (err) {
        Bukkit.getLogger().warning("[CEAAPP] Update check failed: " +
                                   String(err && err.message ? err.message : err));
    }
}