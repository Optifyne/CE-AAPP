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
var Material = Java.type("org.bukkit.Material");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");

function CEchangeArea() {
    var ChangeAreaAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 8) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AREA ACTION: Invalid actionLine format! CORRECT FORMAT: change_area: <world>;<x1>;<y1>;<z1>;<x2>;<y2>;<z2>;<block_to>;(optional) <mode (may be replace, keep, outline or hollow)>;<block_from (only in case of replace mode)>");
                return;
            }

            var worldName = args[0];
            var world = Bukkit.getWorld(worldName);
            var x1 = parseInt(args[1]), y1 = parseInt(args[2]), z1 = parseInt(args[3]);
            var x2 = parseInt(args[4]), y2 = parseInt(args[5]), z2 = parseInt(args[6]);
            var blockToRaw = args[7].toUpperCase();
            var mode = args.length > 8 ? args[8].toLowerCase() : "default";
            var blockFromRaw = args.length > 9 ? args[9].toUpperCase() : null;
            
            if (mode === "replace" && !blockFromRaw) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AREA ACTION: No block_from blocks found for replace mode!");
                return;
            }

            var blockToList = [];
            var rawEntries = blockToRaw.split(",");
            var manualEntries = [];
            var autoEntries = [];

            rawEntries.forEach(function(entry) {
                var match = entry.match(/^(\d+)%(.+)$/);
                if (match) {
                    var percent = parseInt(match[1]);
                    var typeStr = match[2];
                    var mat = Material.matchMaterial(typeStr);
                    if (mat != null) {
                        manualEntries.push({ material: mat, chance: percent });
                    } else {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_AREA ACTION: Invalid block_to material: " + typeStr);
                    }
                } else {
                    autoEntries.push(entry.trim());
                }
            });

            var usedPercent = manualEntries.reduce(function(sum, b) { return sum + b.chance; }, 0);
            var remainingPercent = 100 - usedPercent;
            var autoPercent = autoEntries.length > 0 ? remainingPercent / autoEntries.length : 0;

            autoEntries.forEach(function(typeStr) {
                var mat = Material.matchMaterial(typeStr);
                if (mat != null) {
                    blockToList.push({ material: mat, chance: autoPercent });
                } else {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_AREA ACTION: Invalid block_to material: " + typeStr);
                }
            });

            blockToList = blockToList.concat(manualEntries);

            if (blockToList.length === 0) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_AREA ACTION: No valid block_to materials found!");
                return;
            }

            var blockFromList = [];
            if (mode === "replace" && blockFromRaw) {
                blockFromRaw.split(",").forEach(function(typeStr) {
                    var mat = Material.matchMaterial(typeStr.trim());
                    if (mat != null) {
                        blockFromList.push(mat);
                    } else {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_AREA ACTION: Invalid block_from material: " + typeStr);
                    }
                });
                if (blockFromList.length === 0) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_AREA ACTION: No valid block_from materials for replace mode!");
                    return;
                }
            }

            function getRandomBlock() {
                var totalWeight = blockToList.reduce(function(sum, b) { return sum + b.chance; }, 0);
                if (totalWeight < 100) {
                    blockToList.push({ material: null, chance: 100 - totalWeight });
                }

                var rand = Math.random() * 100;
                var current = 0;
                for (var i = 0; i < blockToList.length; i++) {
                    current += blockToList[i].chance;
                    if (rand <= current) return blockToList[i].material;
                }
                return null;
            }

            var minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            var minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            var minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);

            for (var x = minX; x <= maxX; x++) {
                for (var y = minY; y <= maxY; y++) {
                    for (var z = minZ; z <= maxZ; z++) {
                        var block = world.getBlockAt(x, y, z);

                        if (mode === "replace" && blockFromList.indexOf(block.getType()) === -1) continue;
                        if (mode === "keep" && block.getType() !== Material.AIR) continue;
                        if (mode === "outline" && x > minX && x < maxX && y > minY && y < maxY && z > minZ && z < maxZ) continue;

                        if (mode === "hollow" && x > minX && x < maxX && y > minY && y < maxY && z > minZ && z < maxZ) {
                            block.setType(Material.AIR);
                        } else {
                            var newType = getRandomBlock();
                            if (newType != null) {
                                block.setType(newType);
                            }
                        }
                    }
                }
            }
        }
    });

    var changeAreaInstance = new ChangeAreaAction("change_area");

    return changeAreaInstance;
}

CEchangeArea();