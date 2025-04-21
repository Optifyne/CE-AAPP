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
var ConditionalEventsAPI = Java.type("ce.ajneb97.api.ConditionalEventsAPI");
var pluginString = "TriggerReactor";
var plugin = Bukkit.getPluginManager().getPlugin(pluginString);

var Paths = Java.type("java.nio.file.Paths");
var Files = Java.type("java.nio.file.Files");
var DirectoryStream = Java.type("java.nio.file.DirectoryStream");

function CEActionsActivator() {
    if (plugin != null) {
        var actionsDirectory = Paths.get("plugins/TriggerReactor/Executor/");

        try {
            var directoryStream = Files.newDirectoryStream(actionsDirectory);
            var iterator = directoryStream.iterator();

            while (iterator.hasNext()) {
                var filePath = iterator.next();
                var fileName = filePath.getFileName().toString();

                if (fileName.startsWith("CE") && fileName.endsWith(".js") && !fileName.contains("Activator")) {
                    var action = load(filePath.toString());
                    if (action) {
                        ConditionalEventsAPI.registerApiActions(plugin, action);
                        Bukkit.getLogger().info("[CEActions] Action \"" + fileName + "\" registered successfully!");
                    }
                }
            }

            directoryStream.close();
        } catch (e) {
            Bukkit.getLogger().warning("[CEActions] Failed to read the actions directory: " + e.getMessage());
        }
    } else {
        Bukkit.getLogger().warning("[CEActions] " + pluginString + " plugin not found!");
    }
}