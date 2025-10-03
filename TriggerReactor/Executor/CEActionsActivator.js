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
var pluginString = "ConditionalEvents";
var plugin = Bukkit.getPluginManager().getPlugin(pluginString);

var Paths = Java.type("java.nio.file.Paths");
var Files = Java.type("java.nio.file.Files");
var Runnable = Java.type("java.lang.Runnable");

function CEActionsActivator() {
    if (plugin != null) {
        plugin = Bukkit.getPluginManager().getPlugin("TriggerReactor");
        var ConditionalEventsAPI = Java.type("ce.ajneb97.api.ConditionalEventsAPI");
        var actionsDirectory = Paths.get("plugins/TriggerReactor/Executor/");
        var fileList = [];

        try {
            var stream = Files.newDirectoryStream(actionsDirectory);
            var iterator = stream.iterator();

            while (iterator.hasNext()) {
                var filePath = iterator.next();
                var fileName = filePath.getFileName().toString();

                if (fileName.startsWith("CE") && fileName.endsWith(".js") && !fileName.contains("Activator")) {
                    fileList.push(filePath.toString());
                }
            }

            stream.close();
        } catch (e) {
            Bukkit.getLogger().warning("[CEActions] Failed to read the directory: " + e.message);
            return;
        }

        if (fileList.length === 0) {
            Bukkit.getLogger().info("[CEActions] No files to process.");
            return;
        }

        var index = 0;
        var maxRetries = 3;
        var retries = 0;

        function processFile() {
            if (index >= fileList.length) {
                return;
            }

            var filePath = fileList[index];
            var fileName = filePath.substring(filePath.lastIndexOf("/") + 1);

            try {
                var action = load(filePath);
                if (action) {
                    ConditionalEventsAPI.registerApiActions(plugin, action);
                }

                index++;
                retries = 0;

                Bukkit.getScheduler().runTaskLater(plugin, new Runnable({ run: processFile }), 1);
            } catch (e) {
                retries++;
                Bukkit.getLogger().warning("[CEActions] Error in " + fileName + ": " + e.message +
                                           " (Attempt " + retries + "/" + maxRetries + ")");

                if (retries < maxRetries) {
                    Bukkit.getScheduler().runTaskLater(plugin, new Runnable({ run: processFile }), 20);
                } else {
                    Bukkit.getLogger().warning("[CEActions] Skipping " + fileName + " after " + maxRetries + " attempts.");
                    index++;
                    retries = 0;
                    Bukkit.getScheduler().runTaskLater(plugin, new Runnable({ run: processFile }), 10);
                }
            }
        }

        processFile();
    } else {
        Bukkit.getLogger().warning("[CEActions] " + pluginString + " plugin not found!");
    }
}