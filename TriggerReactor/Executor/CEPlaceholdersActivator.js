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

var PlaceholderAPI = Java.type("me.clip.placeholderapi.PlaceholderAPI");
var PlaceholderExpansion = Java.type("me.clip.placeholderapi.expansion.PlaceholderExpansion");
var Player = Java.type("org.bukkit.entity.Player");
var Enchantment = Java.type("org.bukkit.enchantments.Enchantment");
var Entity = Java.type("org.bukkit.entity.Entity");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Mob = Java.type("org.bukkit.entity.Mob");
var Sittable = Java.type("org.bukkit.entity.Sittable");
var HumanEntity = Java.type("org.bukkit.entity.HumanEntity");
var Damageable = Java.type("org.bukkit.entity.Damageable");
var Attributable = Java.type("org.bukkit.attribute.Attributable");
var Item = Java.type("org.bukkit.entity.Item");
var Vehicle = Java.type("org.bukkit.entity.Vehicle");
var Hanging = Java.type("org.bukkit.entity.Hanging");
var FallingBlock = Java.type("org.bukkit.entity.FallingBlock");
var TNTPrimed = Java.type("org.bukkit.entity.TNTPrimed");
var Villager = Java.type("org.bukkit.entity.Villager");
var UUID = Java.type("java.util.UUID");
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var essentialsPlugin = Bukkit.getPluginManager().getPlugin("Essentials");
var Location = Java.type("org.bukkit.Location");
var Collectors = Java.type("java.util.stream.Collectors");
var luckpermsPlugin = Bukkit.getPluginManager().getPlugin("LuckPerms");
var OfflinePlayer = Java.type("org.bukkit.OfflinePlayer");
var ItemMeta = Java.type("org.bukkit.inventory.meta.ItemMeta");
var ItemFlag = Java.type("org.bukkit.inventory.ItemFlag");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var InventoryHolder = Java.type("org.bukkit.inventory.InventoryHolder");
var Attribute = Java.type("org.bukkit.attribute.Attribute");
var Projectile = Java.type("org.bukkit.entity.Projectile");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var itemsAdderPlugin = Bukkit.getPluginManager().getPlugin("ItemsAdder");
var oraxenPlugin = Bukkit.getPluginManager().getPlugin("Oraxen");
var nexoPlugin = Bukkit.getPluginManager().getPlugin("Nexo");
var DriverManager = Java.type("java.sql.DriverManager");
var SQLException = Java.type("java.sql.SQLException");
var Connection = Java.type("java.sql.Connection");
var PreparedStatement = Java.type("java.sql.PreparedStatement");
var Types = Java.type("java.sql.Types");
var Timestamp = Java.type("java.sql.Timestamp");
var Date = Java.type("java.sql.Date");
var Runnable = Java.type("java.lang.Runnable");
var HashMap = Java.type("java.util.HashMap");
var Structure = Java.type("org.bukkit.generator.structure.Structure");
var EnchantmentStorageMeta = Java.type("org.bukkit.inventory.meta.EnchantmentStorageMeta");
var Directional = Java.type("org.bukkit.block.data.Directional");
var Rotatable = Java.type("org.bukkit.block.data.Rotatable");
var Colorable = Java.type("org.bukkit.material.Colorable");
var TimeUnit = Java.type("java.util.concurrent.TimeUnit");

var customDataTempGlobalData = new HashMap();
var customDataTempTargetsData = new HashMap();

var mysqlResultsCache = new HashMap();
var listResultsCache = new HashMap();
var realUUIDResultsCache = new HashMap();

function CEPlaceholdersActivator() {
    var CEPlaceholders = Java.extend(PlaceholderExpansion, {
        persist: function() {
            return true;
        },

        canRegister: function() {
            return true;
        },

        getAuthor: function() {
            return "0ptifyne";
        },

        getIdentifier: function() {
            return "CEP";
        },

        getVersion: function() {
            return "1.5";
        },

        onPlaceholderRequest: function(player, identifier) {
            
            // ===================== INTERNAL USE ONLY ===================== //
            
            var scheduler = Bukkit.getScheduler();
            var plugin = Bukkit.getPluginManager().getPlugin("TriggerReactor");
            
            function getEntitySync(target) {
                if (Bukkit.isPrimaryThread()) {
                    try {
                        return Bukkit.getEntity(target);
                    } catch (e) {
                        return null;
                    }
                }

                var result = new java.util.concurrent.atomic.AtomicReference();
                var latch = new java.util.concurrent.CountDownLatch(1);

                scheduler.runTask(plugin, new java.lang.Runnable({
                    run: function () {
                        try {
                            result.set(Bukkit.getEntity(target));
                        } catch (e) {
                            result.set(null);
                        } finally {
                            latch.countDown();
                        }
                    }
                }));

                latch.await();
                return result.get();
            }
            
            function getPlayerSync(target, offline) {
                if (Bukkit.isPrimaryThread()) {
                    return offline ? Bukkit.getOfflinePlayer(target) : Bukkit.getPlayer(target);
                }

                var result = new java.util.concurrent.atomic.AtomicReference();
                var latch = new java.util.concurrent.CountDownLatch(1);

                scheduler.runTask(plugin, new java.lang.Runnable({
                    run: function () {
                        try {
                            var player = offline ? Bukkit.getOfflinePlayer(target) : Bukkit.getPlayer(target);
                            result.set(player);
                        } finally {
                            latch.countDown();
                        }
                    }
                }));

                latch.await();
                return result.get();
            }
            
            var operators = [
                "!equalsIgnoreCase","equalsIgnoreCase",
                "!equals",          "equals",
                "!startsWith",      "startsWith",
                "!endsWith",        "endsWith",
                "!contains",        "contains",
                "!matches",         "matches",
                ">=", "<=", "==", "!=", ">", "<"
            ];
            
            function compare(value, operator, target) {
                if (value === null || value === undefined) return false;
                
                value = value.toString();
                target = target.toString();

                if (operator === ">=") return parseFloat(value) >= parseFloat(target);
                if (operator === "<=") return parseFloat(value) <= parseFloat(target);
                if (operator === ">") return parseFloat(value) > parseFloat(target);
                if (operator === "<") return parseFloat(value) < parseFloat(target);
                if (operator === "==" || operator === "equals") return value == target;
                if (operator === "!=" || operator === "!equals") return value != target;
                if (operator === "equalsIgnoreCase") return value.toLowerCase() === target.toLowerCase();
                if (operator === "!equalsIgnoreCase") return value.toLowerCase() !== target.toLowerCase();
                if (operator === "startsWith") return value.indexOf(target) === 0;
                if (operator === "!startsWith") return value.indexOf(target) !== 0;
                if (operator === "contains") return value.indexOf(target) !== -1;
                if (operator === "!contains") return value.indexOf(target) === -1;
                if (operator === "endsWith") return value.endsWith(target);
                if (operator === "!endsWith") return !value.endsWith(target);
                if (operator === "matches") return new RegExp(target).test(value);
                if (operator === "!matches") return !new RegExp(target).test(value);
                return false;
            }
                
            function splitByFirstOpOutsidePlaceholders(s, ops) {
                var phDepth = 0;
                var paren = 0;

                for (var i = 0; i < s.length; i++) {
                    var c = s.charAt(i);

                    if (c === "\\" && i + 1 < s.length &&
                       (s.charAt(i + 1) === "$" || s.charAt(i + 1) === "@")) {
                        i++;
                        continue;
                    }

                    if (c === "$") { phDepth++; continue; }
                    if (c === "@") { phDepth--; continue; }

                    if (phDepth === 0) {
                        if (c === "(") { paren++;  continue; }
                        if (c === ")") { paren--;  continue; }

                        if (paren === 0) {
                            for (var j = 0; j < ops.length; j++) {
                                var op = ops[j];
                                if (s.substr(i, op.length) === op) {
                                    return [
                                        s.substring(0, i),
                                        op,
                                        s.substring(i + op.length)
                                    ];
                                }
                            }
                        }
                    }
                }
                return null;
            }
                            
            function resolveNestedPlaceholders(player, input) {
                function unescape(str) {
                    return str.replace(/\\([$@])/g, "$1");
                }

                function findDeepestPlaceholder(input) {
                    var stack = [];
                    for (var i = 0; i < input.length; i++) {
                        if (input.charAt(i) === "\\" && (input.charAt(i + 1) === "$" || input.charAt(i + 1) === "@")) {
                            i++;
                            continue;
                        }
                        if (input.charAt(i) === "$") {
                            stack.push(i);
                        } else if (input.charAt(i) === "@") {
                            var start = stack.pop();
                            if (start !== undefined) {
                                var raw = input.substring(start, i + 1);
                                var content = raw.substring(1, raw.length - 1);
                                return { raw: raw, content: content };
                            }
                        }
                    }
                    return null;
                }

                while (true) {
                    var deepest = findDeepestPlaceholder(input);
                    if (!deepest) break;

                    var raw = deepest.raw;
                    var content = deepest.content;

                    var resolvedInner = resolveNestedPlaceholders(player, content);
                    var papiValue = PlaceholderAPI.setBracketPlaceholders(player, "{" + resolvedInner + "}");

                    input = input.replace(raw, papiValue);
                }

                return unescape(input);
            }

            function tokenize(input) {
                var tokens = [];
                var buffer = "";
                var depth = 0;

                for (var i = 0; i < input.length; i++) {
                    var c = input.charAt(i);

                    if (c === '(') {
                        if (depth === 0 && buffer.trim().length > 0) {
                            tokens.push(buffer);
                            buffer = "";
                        }
                        depth++;
                        buffer += c;
                    } else if (c === ')') {
                        depth--;
                        buffer += c;
                        if (depth === 0) {
                            tokens.push(buffer);
                            buffer = "";
                        }
                    } else if (depth === 0 && input.substring(i).startsWith(" AND ")) {
                        if (buffer.trim().length > 0) tokens.push(buffer);
                        tokens.push("AND");
                        buffer = "";
                        i += 4;
                    } else if (depth === 0 && input.substring(i).startsWith(" OR ")) {
                        if (buffer.trim().length > 0) tokens.push(buffer);
                        tokens.push("OR");
                        buffer = "";
                        i += 3;
                    } else {
                        buffer += c;
                    }
                }

                if (buffer.trim().length > 0) {
                        tokens.push(buffer);
                }

                return tokens;
            }

            function parseExpression(expr) {
                if (expr.startsWith("(") && expr.endsWith(")")) {
                    return parseExpression(expr.substring(1, expr.length - 1));
                }

                var tokens = tokenize(expr);

                for (var i = 0; i < tokens.length; i++) {
                    if (tokens[i] === "OR") {
                        return {
                            type: "OR",
                            left: parseExpression(tokens.slice(0, i).join(" ")),
                            right: parseExpression(tokens.slice(i + 1).join(" "))
                        };
                    }
                }

                for (var i = 0; i < tokens.length; i++) {
                    if (tokens[i] === "AND") {
                        return {
                            type: "AND",
                            left: parseExpression(tokens.slice(0, i).join(" ")),
                            right: parseExpression(tokens.slice(i + 1).join(" "))
                        };
                    }
                }

                var split = splitByFirstOpOutsidePlaceholders(expr, operators);

                if (split) {
                    return {
                        type:       "COND",
                        placeholder: split[0],
                        operator:    split[1],
                        expected:    split[2]
                    };
                }

                return null;
            }

            function evaluateExpression(p, exprObj) {
                if (!exprObj) return true; 
                if (exprObj.type === "AND") {
                    return evaluateExpression(p, exprObj.left) && evaluateExpression(p, exprObj.right);
                }
                if (exprObj.type === "OR") {
                    return evaluateExpression(p, exprObj.left) || evaluateExpression(p, exprObj.right);
                }
                if (exprObj.type === "COND") {
                    var left  = resolveNestedPlaceholders(p, exprObj.placeholder);
                    var right = resolveNestedPlaceholders(p, exprObj.expected);
                    return compare(left, exprObj.operator, right);
                }
                return false;
            }
            
            function uuidFromPlain(plain) {
                var hyphenated = plain.replaceFirst("(\\p{XDigit}{8})(\\p{XDigit}{4})(\\p{XDigit}{4})(\\p{XDigit}{4})(\\p{XDigit}+)",
                    "$1-$2-$3-$4-$5");
                return UUID.fromString(hyphenated);
            }

            function fetchMojangUUIDAsync(name) {
                return java.util.concurrent.CompletableFuture.supplyAsync(function () {
                    try {
                        var url = new java.net.URL("https://api.mojang.com/users/profiles/minecraft/" + java.net.URLEncoder.encode(name, "UTF-8"));
                        var con = url.openConnection();
                        con.setRequestMethod("GET");
                        con.setConnectTimeout(5000);
                        con.setReadTimeout(5000);

                        var code = con.getResponseCode();
                        if (code !== 200) return null;

                        var br = new java.io.BufferedReader(new java.io.InputStreamReader(con.getInputStream()));
                        var obj = com.google.gson.JsonParser.parseReader(br).getAsJsonObject();
                        var id = obj.get("id").getAsString();
                        br.close();

                        return uuidFromPlain(id);
                    } catch (e) {
                        e.printStackTrace();
                        return null;
                    }
                });
            }
            
            function normalizeString(str) {
                return str
                    .replace(/\\\\ᵕ/g, "\uE000")
                    .replace(/\\\\╵/g, "\uE001")
                    .replace(/\\\\</g, "\uE002")
                    .replace(/\\\\>/g, "\uE003")

                    .replace(/\\ᵕ/g, "\\_")
                    .replace(/\\╵/g, "\\%")
                    .replace(/\\</g, "\\{")
                    .replace(/\\>/g, "\\}")

                    .replace(/ᵕ/g, "_")
                    .replace(/╵/g, "%")
                    .replace(/</g, "{")
                    .replace(/>/g, "}")

                    .replace(/\uE000/g, "ᵕ")
                    .replace(/\uE001/g, "╵")
                    .replace(/\uE002/g, "<")
                    .replace(/\uE003/g, ">");
            }
            
            // ===================== ITEMS CHECKING FEATURES ===================== //
            
            if (identifier.startsWith("item_")) {
                var args = identifier.substring("item_".length).split("_");
                
                if (args.length < 1) return "InvalidArguments";
                
                var mode = args[0];
                var restrict = mode !== "handSlot" && !mode.startsWith("cooldown:");
                var rawSlot = restrict ? args[1].replaceAll("-", "_").toUpperCase().split("|") : null;
                var targetIdentifier = args[restrict ? 2 : 1] && args[restrict ? 2 : 1] !== "" ? args.slice(restrict ? 2 : 1).join("_") : player.getName();
    
                var target = null;
                var inventory = null;
                var parts = targetIdentifier.split(",");
                
                if (parts.length === 4) {
                	try {
                        var world = Bukkit.getWorld(parts[0]);
                        var x = parseFloat(parts[1]);
                        var y = parseFloat(parts[2]);
                        var z = parseFloat(parts[3]);

                        var state = world.getBlockAt(x, y, z).getState();

                        if (state && state instanceof InventoryHolder) {
                            target = state;
                            inventory = target.getInventory();
                        } else {
                            return "TargetBlockIsNotInventoryHolder";
                        }
                    } catch (e) {
                    	return "InvalidCoordinates";
                    }
                } else if (targetIdentifier.length === 36) {
                    try {
                        var uuid = UUID.fromString(targetIdentifier);
                        var entity = getEntitySync(uuid);
                        
                        if (entity) {
                            target = entity;
                            inventory = target.getInventory ? target.getInventory() : target.getEquipment();
                        }
                    } catch (e) {
                        return "InvalidEntity";
                    }
                } else {
                    var onlinePlayer = getPlayerSync(targetIdentifier, false);
                    
                    if (onlinePlayer) {
                    	target = onlinePlayer;
                        inventory = target.getInventory();
                    } else {
                    	return "InvalidPlayer";
                    }
                }

                if (!target) return "InvalidTarget";
                if (!inventory) return "InvalidTargetInventory";
                
                if (mode === "handSlot") return inventory.getHeldItemSlot ? inventory.getHeldItemSlot() : "MainHand";
                if (mode.startsWith("cooldown:")) {
                	if (!(target instanceof HumanEntity)) return "TargetIsNotHumanEntity";
                    var material = Material.matchMaterial(mode.split(":")[1].replaceAll("-", "_"));
                    if (material) return target.getCooldown(material);
                    else return "InvalidMaterial";
                }
				
                var opened = rawSlot && rawSlot.length > 1 && rawSlot[0] === "OPENED";
                var ec = rawSlot && rawSlot.length > 1 && rawSlot[0] === "EC";
                var slotExact = rawSlot ? opened || ec ? rawSlot[1] : rawSlot[0] : 0;
                var slotIndex = !isNaN(slotExact) ? parseInt(slotExact) : slotExact;
                var item = null;
                        
                if (slotIndex === "CURSOR") item = target.getItemOnCursor ? target.getItemOnCursor() : null;
                if (opened && target instanceof HumanEntity) inventory = target.getOpenInventory().getTopInventory();
                if (ec && target instanceof HumanEntity) inventory = target.getEnderChest();

                if (!item) {
                    try {
                        item = !isNaN(slotIndex) ? inventory.getItem(slotIndex) : inventory.getItem(EquipmentSlot.valueOf(slotIndex));
                    } catch (e) {
                        return "InvalidSlot";
                    }
                }
                
                if (!item || item.getType().isAir()) return "ItemNotFound";
				
                if (mode.startsWith("lore")) {
                    var meta = item.getItemMeta();
                    if (!meta || !meta.hasLore()) return "";
                    var lore = meta.getLore().toArray();
                    if (mode.endsWith("Amount")) return lore.length;
                    
                    var selectedLore = "";
                    
                    if (mode.indexOf(":") !== -1) {
                        var args = mode.split(":");
                        var indexArg = args[1];
                        var indexes = indexArg.split(",");

                        for (var j = 0; j < indexes.length; j++) {
                            var index = parseInt(indexes[j]);
                            if (!isNaN(index) && index >= 0 && index < lore.length) {
                                selectedLore += lore[index] + "|";
                            }
                        }
                    } else {
                        var loreText = "";
                        for (var i = 0; i < lore.length; i++) {
                            loreText += lore[i] + "|";
                        }
                        return loreText.trim();
                    }

                    return selectedLore.trim() || "InvalidIndex";
                }
                
                if (mode.startsWith("enchantment") && !mode.startsWith("enchantmentBook") && !mode.startsWith("enchantments")) {
                    if (mode.indexOf(":") === -1) return "InvalidEnchantment";
                    var enchantmentString = mode.split(":")[1].replaceAll("-", "_");
                    var enchantment = Enchantment.getByName(enchantmentString.toUpperCase());
                    if (!enchantment) return "InvalidEnchantment";
                    
                    return enchantment && item.containsEnchantment(enchantment) ? item.getEnchantmentLevel(enchantment) : "0";
                }
                
                if (mode.startsWith("enchantmentBook")) {
                    if (mode.indexOf(":") === -1) return "InvalidEnchantment";
                        
                    var meta = item.getItemMeta();
                    if (!(meta instanceof EnchantmentStorageMeta)) return "ItemIsNotEnchantedBook";
                        
                    var enchantmentString = mode.split(":")[1].replaceAll("-", "_");
                    var enchantment = Enchantment.getByName(enchantmentString.toUpperCase());
                    if (!enchantment) return "InvalidEnchantment";
                        
                    return enchantment && meta.hasStoredEnchant(enchantment) ? meta.getStoredEnchantLevel(enchantment) : "0";
                }
                
                if (mode.startsWith("dataContainer-")) {
                    if (!item.hasItemMeta()) return "None";
                    var meta = item.getItemMeta();
                    var data = meta.getPersistentDataContainer();
                    var parts = mode.split(":");

                    if ((mode.startsWith("dataContainer-value") || mode.startsWith("dataContainer-type")) && parts.length < 3) return "NotEnoughData";
                    if (mode.startsWith("dataContainer-all") && parts.length < 2) return "NotEnoughData";

                    var name = parts[1];
                    
                    var storedTypes = [
                    	PersistentDataType.STRING, PersistentDataType.INTEGER, PersistentDataType.FLOAT, PersistentDataType.DOUBLE,
						PersistentDataType.LONG, PersistentDataType.BYTE, PersistentDataType.SHORT, PersistentDataType.BOOLEAN,
						PersistentDataType.BYTE_ARRAY, PersistentDataType.INTEGER_ARRAY, PersistentDataType.LONG_ARRAY
                   ];
                    var storedStringTypes = [
                    	"STRING", "INTEGER", "FLOAT", "DOUBLE",
						"LONG", "BYTE", "SHORT", "BOOLEAN",
						"BYTE_ARRAY", "INTEGER_ARRAY", "LONG_ARRAY"
                   ];
                    
                    try {
                        if (mode.startsWith("dataContainer-all")) {
                            var keys = data.getKeys();
                            var foundData = [];

                            keys.forEach(function (key) {
                                if (key.getNamespace() === name) {
                                    var output = null;
                                    for (var i = 0; i < storedTypes.length; i++) {
                                        try {
                                            output = data.get(key, storedTypes[i]);
                                            if (output !== null) break;
                                        } catch (e) {}
                                    }
                                    if (output instanceof Java.type("int[]") || output instanceof Java.type("long[]") || output instanceof Java.type("byte[]")) {
                                        output = Java.from(output);
                                    }

                                    foundData.push(key.getKey() + ": " + output);
                                }
                            });

                            return foundData.length > 0 ? foundData.join(" | ") : "None";
                        } else if (mode.startsWith("dataContainer-value")) {
                            var id = parts[2];

                            var key = new NamespacedKey(name, id);
                            var output = null;
                            for (var i = 0; i < storedTypes.length; i++) {
                            	try {
                                	output = data.get(key, storedTypes[i]);
                                	if (output !== null) {
                                        if (output instanceof Java.type("int[]") || output instanceof Java.type("long[]") || output instanceof Java.type("byte[]")) {
                                            output = Java.from(output);
                                        }
                                        return output;
                                        break;
                                    }
                                } catch (e) {}
                            }
                            return "None";
                        } else if (mode.startsWith("dataContainer-type")) {
                            var id = parts[2];

                            var key = new NamespacedKey(name, id);
                            var output = null;
                            for (var i = 0; i < storedTypes.length; i++) {
                            	try {
                                	output = data.get(key, storedTypes[i]);
                                	if (output !== null) {
                                        return storedStringTypes[i];
                                        break;
                                    }
                                } catch (e) {}
                            }
                            return "None";
                        }
                    } catch (e) {
                        return "None";
                    }
                }
                
                switch (mode) {
                    case "enchantments":
                        var enchantments = item.getEnchantments();
                        if (!enchantments || enchantments.isEmpty()) return "None";
                        var enchantmentList = [];
                        var keys = enchantments.keySet().toArray();
                        for (var i = 0; i < keys.length; i++) {
                            var entry = keys[i];
                            enchantmentList.push(entry.getName() + "=" + enchantments.get(entry));
                        }
                        return enchantmentList.join(",");
                    case "enchantmentsBook":
                        var meta = item.getItemMeta();
                        if (!(meta instanceof EnchantmentStorageMeta)) return "ItemIsNotEnchantedBook";
                        
                        var enchantments = meta.getStoredEnchants();
                        if (!enchantments || enchantments.isEmpty()) return "None";
                        var enchantmentList = [];
                        var keys = enchantments.keySet().toArray();
                        for (var i = 0; i < keys.length; i++) {
                            var entry = keys[i];
                            enchantmentList.push(entry.getName() + "=" + enchantments.get(entry));
                        }
                        return enchantmentList.join(",");
                    case "maxDurability":
                        return item.getType().getMaxDurability();
                    case "currentDurability":
                        var meta = item.getItemMeta();
                        return meta.hasDamage() ? (item.getType().getMaxDurability() - meta.getDamage()) : item.getType().getMaxDurability();
                    case "amount":
                        return item.getAmount();
                    case "name":
                        var meta = item.getItemMeta();
                        return meta.hasDisplayName() ? meta.getDisplayName() : "";
                    case "flags":
                        var meta = item.getItemMeta();
                        if (!meta) return "None";
                        var flags = meta.getItemFlags();
                        if (!flags || flags.isEmpty()) return "None";
                        var flagList = [];
                        var flagArray = flags.toArray();
                        for (var i = 0; i < flagArray.length; i++) {
                            flagList.push(flagArray[i].toString());
                        }
                        return flagList.join(",");
                    case "material":
                        return item.getType().toString();
                    case "customModelData":
                        var meta = item.getItemMeta();
                        return meta.hasCustomModelData() ? meta.getCustomModelData() : "None";
                    case "itemsAdder":
                        if (!itemsAdderPlugin) {
                        	return "ItemsAdderPluginIsMissing";
                        } else {
            				var itemsAdderStack = Java.type("dev.lone.itemsadder.api.CustomStack");
                        	return itemsAdderStack.byItemStack(item) ? itemsAdderStack.byItemStack(item) : "No";
                        }
                    case "oraxen":
                        if (!oraxenPlugin) {
                        	return "OraxenPluginIsMissing";
                        } else {
            				var oraxenStack = Java.type("io.th0rgal.oraxen.api.OraxenItems");
                        	return oraxenStack.getIdByItem(item) ? oraxenStack.getIdByItem(item) : "No";
                        }
					case "nexo":
                        if (!nexoPlugin) {
                        	return "NexoPluginIsMissing";
                        } else {
            				var nexoStack = Java.type("com.nexomc.nexo.api.NexoItems");
                        	return nexoStack.idFromItem(item) ? nexoStack.idFromItem(item) : "No";
                        }
                    case "maxStack":
                        return item.getMaxStackSize ? item.getMaxStackSize() : "None";
                    case "cooldown":
                        if (!(target instanceof HumanEntity)) return "TargetIsNotHumanEntity";
                        var cooldown = null;
                        try {
                        	cooldown = target.getCooldown(item);
                        } catch (e) {}
                        return cooldown !== null ? cooldown : "None";
                    case "cooldownBasic":
                        if (!(target instanceof HumanEntity)) return "TargetIsNotHumanEntity";
                        var cooldown = null;
                        try {
                            var meta = item.getItemMeta();
                        	cooldown = meta.getUseCooldown().getCooldownSeconds();
                        } catch (e) {}
                        return cooldown !== null ? cooldown : "None";
                    case "itemModel":
                        var meta = item.getItemMeta();
                        return meta.getItemModel ? meta.getItemModel() : "None";
                    default:
                        return "InvalidArguments";
                }
            }
            
            // ===================== LUCKPERMS PERMISSIONS WITH CONTEXTS ===================== //
            
            if (identifier.startsWith("lp_has_permission_in_contexts_") || identifier.startsWith("lp_get_permission_contexts_")) {
                if (!luckpermsPlugin) {
                	return "LuckPermsPluginIsMissing";
            	} else {
                    var LuckPerms = Java.type("net.luckperms.api.LuckPerms");
                    var MutableContextSet = Java.type("net.luckperms.api.context.MutableContextSet");
                    var QueryOptions = Java.type("net.luckperms.api.query.QueryOptions");
                    var UserManager = Java.type("net.luckperms.api.model.user.UserManager");
                    var PlayerAdapter = Java.type("net.luckperms.api.platform.PlayerAdapter");
                    var PermissionNode = Java.type("net.luckperms.api.node.types.PermissionNode");
                    var parts, has;
                    if (identifier.startsWith("lp_has_permission_in_contexts_")) {
                        var parts = identifier.substring("lp_has_permission_in_contexts_".length).split("_");
                        has = true;
                    } else if (identifier.startsWith("lp_get_permission_contexts_")) {
                        var parts = identifier.substring("lp_get_permission_contexts_".length).split("_");
                        has = false;
                    }

                    if (parts.length < 3 && has) return "InvalidArguments";

                    if (parts.length >= 2) {
                        var playerOrGroup = parts.slice(0, parts.length - 2).join("_");
                        var permission = parts[parts.length - 2].replaceAll("ᵕ", "_");
                        var contextString = parts[parts.length - 1] ? parts[parts.length - 1].replaceAll("ᵕ", "_") : null;

                        var luckPerms = Bukkit.getServicesManager().getRegistration(LuckPerms.class).getProvider();

                        function getPlayerContexts(player) {
                            var contextManager = luckPerms.getContextManager();
                            var contexts = contextManager.getContextForPlayer(player);
                            return contexts;
                        }

                        function getContextsForPermission(target, permission, contextString, isGroup) {
                            var contextsForPermission = [];
                            var requestedContexts = contextString ? contextString.split(",") : [];

                            function processNodes(nodes) {
                                var iterator = nodes.iterator();
                                while (iterator.hasNext()) {
                                    var node = iterator.next();
                                    if (node instanceof PermissionNode && node.getPermission().equals(permission) && node.getValue()) {
                                        var contexts = node.getContexts();

                                        if (requestedContexts.length > 0) {
                                            for (var i = 0; i < requestedContexts.length; i++) {
                                                var requestedContext = requestedContexts[i].trim();
                                                if (!requestedContext) continue;

                                                var values = contexts.getValues(requestedContext);
                                                if (values != null && !values.isEmpty()) {
                                                    var valuesArray = [];
                                                    var valuesIterator = values.iterator();
                                                    while (valuesIterator.hasNext()) {
                                                        valuesArray.push(valuesIterator.next());
                                                    }
                                                    contextsForPermission.push(requestedContext + "=" + valuesArray.join(", "));
                                                } else {
                                                    contextsForPermission.push(requestedContext + "=null");
                                                }
                                            }
                                        } else {
                                            var allContexts = contexts.toSet();
                                            var allIterator = allContexts.iterator();
                                            while (allIterator.hasNext()) {
                                                var context = allIterator.next();
                                                contextsForPermission.push(context.getKey() + "=" + context.getValue());
                                            }
                                        }
                                    }
                                }
                            }

                            if (isGroup) {
                                var group = luckPerms.getGroupManager().getGroup(target);
                                if (group != null) {
                                    processNodes(group.getNodes());
                                }
                            } else {
                                var userManager = luckPerms.getUserManager();
                                var user = userManager.getUser(target);

                                if (user == null) {
                                    var future = userManager.loadUser(target);
                                    user = future.join();
                                }

                                if (user != null) {
                                    processNodes(user.getNodes());
                                }
                            }

                            return contextsForPermission.length > 0 ? contextsForPermission.join(", ") : "No contexts found";
                        }

                        function hasPermissionWithContexts(target, permission, contextString, isGroup) {
                            var contextSet = MutableContextSet.create();

                            var contextsArray = contextString.split(",");
                            for (var i = 0; i < contextsArray.length; i++) {
                                var parts = contextsArray[i].split("=");
                                if (parts.length === 2) {
                                    contextSet.add(parts[0], parts[1].trim());
                                }
                            }

                            if (isGroup) {
                                var group = luckPerms.getGroupManager().getGroup(target);
                                if (group != null) {
                                    var nodes = group.getNodes();
                                    var iterator = nodes.iterator();
                                    while (iterator.hasNext()) {
                                        var node = iterator.next();
                                        if (node instanceof PermissionNode && node.getPermission().equals(permission) && node.getValue() && node.getContexts().equals(contextSet)) {
                                            return true;
                                        }
                                    }
                                }
                            } else {
                                var userManager = luckPerms.getUserManager();
                                var user = userManager.getUser(target);

                                if (user == null) {
                                    try {
                                        var offlinePlayer = getPlayerSync(target, true);
                                        var future = userManager.loadUser(offlinePlayer.getUniqueId());
                                        user = future.join();
                                    } catch (e) {
                                        return "PlayerNotFound";
                                    }
                                }

                                if (user != null) {
                                    var nodes = user.getNodes();
                                    var iterator = nodes.iterator();
                                    while (iterator.hasNext()) {
                                        var node = iterator.next();
                                        if (node instanceof PermissionNode && node.getPermission().equals(permission) && node.getValue() && node.getContexts().equals(contextSet)) {
                                            return true;
                                        }
                                    }
                                }
                            }

                            return false;
                        }

                        var isGroup = false;

                        if (playerOrGroup.startsWith("group-")) {
                            playerOrGroup = playerOrGroup.substring(6);
                            isGroup = true;
                        }

                        var result = has ? hasPermissionWithContexts(playerOrGroup, permission, contextString, isGroup) : getContextsForPermission(playerOrGroup, permission, contextString, isGroup);

                        if (has) {
                            return result ? "true" : "false";
                        } else {
                            return result;
                        }
                    }

                    return "InvalidArguments";
                }
            }
            
            // ===================== HIGHEST BLOCK IN LOCATION ===================== //
            
            if (identifier.startsWith("highestBlock_player_")) {
                var playerName = identifier.substring("highestBlock_player_".length());
                var playerNameEndIndex = playerName.lastIndexOf("_");
                if (playerNameEndIndex !== -1) {
                    playerName = playerName.substring(0, playerNameEndIndex);
                }
                    
                var targetPlayer = playerName === "" ? player : getPlayerSync(playerName, false);
                if (targetPlayer != null) {
                    var targetLocation = targetPlayer.getLocation();
                    var targetWorld = targetLocation.getWorld();
                        
                    if (identifier.endsWith("_type")) {
                        return targetWorld.getHighestBlockAt(targetLocation).getType().toString();
                    } else {
                        return targetWorld.getHighestBlockYAt(targetLocation);
                    }
                } else {
                    return "PlayerNotFound";
                }
            }
            
            if (identifier.startsWith("highestBlock_uuid_")) {
                var uuidString = identifier.substring("highestBlock_uuid_".length());
                if (uuidString === "") return "InvalidUUID";
                var uuid = UUID.fromString(uuidString);
                var entity = getEntitySync(uuid);
                if (entity != null) {
                    var entitylocation = entity.getLocation();
                    var entityWorld = entitylocation.getWorld();
                        
                    if (identifier.endsWith("_type")) {
                        return entityWorld.getHighestBlockAt(entitylocation).getType().toString();
                    } else {
                        return entityWorld.getHighestBlockYAt(entitylocation);
                    }
                } else {
                    return "EntityNotFound";
                }
            }
            
            if (identifier.startsWith("highestBlock_coords_")) {
                var location = identifier.substring("highestBlock_coords_".length()).split(",");
                if (location.length < 3) return "InvalidLocation";
                var locationEndIndex = location.lastIndexOf("_");
                if (locationEndIndex !== -1) {
                    location = location.substring(0, locationEndIndex);
                }
                var worldName = location[0];
                var x = parseInt(location[1]);
                var z = parseInt(location[2]);
                var world = Bukkit.getWorld(worldName);
                    
                if (world != null && !isNaN(x) && !isNaN(z)) {
                    if (identifier.endsWith("_type")) {
                        return world.getHighestBlockAt(x, z).getType().toString();
                    } else {
                        return world.getHighestBlockYAt(x, z);
                    }
                } else {
                    return "LocationNotFound";
                }
            }
            
            // ===================== RANDOM BLOCK IN AREA ===================== //
            
            if (identifier.startsWith("randomBlock_")) {
                var blocksIndex = identifier.indexOf("blocks=");

                var parts = [];
                if (blocksIndex !== -1) {
                    parts = identifier.substring("randomBlock_".length, blocksIndex).split("_");
                } else {
                    parts = identifier.substring("randomBlock_".length).split("_");
                }

                if (parts.length >= 8) {
                    var worldName, minX, minY, minZ, maxX, maxY, maxZ;
					
                    if (!parseInt(parts[parts.length - 10]) && parts.length == 17) {
                        worldName = parts[parts.length - 17].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 16]);
                        minY = parseInt(parts[parts.length - 15]);
                        minZ = parseInt(parts[parts.length - 14]);
                        maxX = parseInt(parts[parts.length - 13]);
                        maxY = parseInt(parts[parts.length - 12]);
                        maxZ = parseInt(parts[parts.length - 11]);
                    } else if (!parseInt(parts[parts.length - 9]) && parts.length == 16) {
                        worldName = parts[parts.length - 16].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 15]);
                        minY = parseInt(parts[parts.length - 14]);
                        minZ = parseInt(parts[parts.length - 13]);
                        maxX = parseInt(parts[parts.length - 12]);
                        maxY = parseInt(parts[parts.length - 11]);
                        maxZ = parseInt(parts[parts.length - 10]);
                    } else if (!parseInt(parts[parts.length - 8]) && parts.length == 15) {
                        worldName = parts[parts.length - 15].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 14]);
                        minY = parseInt(parts[parts.length - 13]);
                        minZ = parseInt(parts[parts.length - 12]);
                        maxX = parseInt(parts[parts.length - 11]);
                        maxY = parseInt(parts[parts.length - 10]);
                        maxZ = parseInt(parts[parts.length - 9]);
                    } else if (!parseInt(parts[parts.length - 7]) && parts.length == 14) {
                        worldName = parts[parts.length - 14].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 13]);
                        minY = parseInt(parts[parts.length - 12]);
                        minZ = parseInt(parts[parts.length - 11]);
                        maxX = parseInt(parts[parts.length - 10]);
                        maxY = parseInt(parts[parts.length - 9]);
                        maxZ = parseInt(parts[parts.length - 8]);
                    } else if (!parseInt(parts[parts.length - 6]) && parts.length == 13) {
                        worldName = parts[parts.length - 13].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 12]);
                        minY = parseInt(parts[parts.length - 11]);
                        minZ = parseInt(parts[parts.length - 10]);
                        maxX = parseInt(parts[parts.length - 9]);
                        maxY = parseInt(parts[parts.length - 8]);
                        maxZ = parseInt(parts[parts.length - 7]);
                    } else if (!parseInt(parts[parts.length - 5]) && parts.length == 12) {
                        worldName = parts[parts.length - 12].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 11]);
                        minY = parseInt(parts[parts.length - 10]);
                        minZ = parseInt(parts[parts.length - 9]);
                        maxX = parseInt(parts[parts.length - 8]);
                        maxY = parseInt(parts[parts.length - 7]);
                        maxZ = parseInt(parts[parts.length - 6]);
                    } else if (!parseInt(parts[parts.length - 4]) && parts.length == 11) {
                        worldName = parts[parts.length - 11].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 10]);
                        minY = parseInt(parts[parts.length - 9]);
                        minZ = parseInt(parts[parts.length - 8]);
                        maxX = parseInt(parts[parts.length - 7]);
                        maxY = parseInt(parts[parts.length - 6]);
                        maxZ = parseInt(parts[parts.length - 5]);
                    } else if (!parseInt(parts[parts.length - 3]) && parts.length == 10) {
                        worldName = parts[parts.length - 10].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 9]);
                        minY = parseInt(parts[parts.length - 8]);
                        minZ = parseInt(parts[parts.length - 7]);
                        maxX = parseInt(parts[parts.length - 6]);
                        maxY = parseInt(parts[parts.length - 5]);
                        maxZ = parseInt(parts[parts.length - 4]);
                    } else if (!parseInt(parts[parts.length - 2]) && parts.length == 9) {
                        worldName = parts[parts.length - 9].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 8]);
                        minY = parseInt(parts[parts.length - 7]);
                        minZ = parseInt(parts[parts.length - 6]);
                        maxX = parseInt(parts[parts.length - 5]);
                        maxY = parseInt(parts[parts.length - 4]);
                        maxZ = parseInt(parts[parts.length - 3]);
                    } else if (!parseInt(parts[parts.length - 1]) && parts.length == 8) {
                        worldName = parts[parts.length - 8].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 7]);
                        minY = parseInt(parts[parts.length - 6]);
                        minZ = parseInt(parts[parts.length - 5]);
                        maxX = parseInt(parts[parts.length - 4]);
                        maxY = parseInt(parts[parts.length - 3]);
                        maxZ = parseInt(parts[parts.length - 2]);
                    }

                    var world = Bukkit.getWorld(worldName);
                    if (world != null && !isNaN(minX) && !isNaN(minY) && !isNaN(minZ) &&
                        !isNaN(maxX) && !isNaN(maxY) && !isNaN(maxZ)) {

                        var includeSolid = identifier.indexOf("_solid") !== -1;
                        var includeFluid = identifier.indexOf("_fluid") !== -1;
                        var excludeAir = identifier.indexOf("_!air") !== -1;
                        var highestOffset = identifier.indexOf("_highest") !== -1;
                        if (highestOffset) {
                            var match = identifier.match(/highest([+-]?\d+)/);
                            if (match) {
                                highestOffset = parseInt(match[1], 10);
                            }
                        }
                        
                        var blockList = [];

                        if (identifier.indexOf("blocks=") !== -1) {
                            var blockString = identifier.split("blocks=")[1];
                            if (blockString.indexOf(";") !== -1) {
                                blockString = blockString.split(";")[0];
                            }
                            blockList = blockString.split(",").map(function(item) { return item.trim(); });
                        }
                        
                        var blockDataList = [];
                        
                        if (identifier.indexOf("block-data=") !== -1) {
                            var blockDataString = identifier.split("block-data=")[1].replaceAll("ᵕ", "_");
                            if (blockDataString.indexOf(";") !== -1) {
                                blockDataString = blockDataString.split(";")[0];
                            }
                            blockDataList = blockDataString.split("|").map(function(item) { return item.trim(); });
                        }
                        
                        var coordsList = parseCoordsList(identifier);

                        var validBlocks = [];

                        var startX = Math.min(minX, maxX);
                        var endX = Math.max(minX, maxX);
                        var startY = Math.min(minY, maxY);
                        var endY = Math.max(minY, maxY);
                        var startZ = Math.min(minZ, maxZ);
                        var endZ = Math.max(minZ, maxZ);

                        var excludedCoords = [];
                        var includedCoords = [];

                        for (var i = 0; i < coordsList.length; i++) {
                            var c = coordsList[i];
                            if (c.negate) {
                                excludedCoords.push(c);
                            } else {
                                includedCoords.push(c);
                            }
                        }

                        function isExcluded(x, y, z, worldName) {
                            for (var i = 0; i < excludedCoords.length; i++) {
                                var coord = excludedCoords[i];
                                if (coord.world === worldName &&
                                    x >= coord.minX && x <= coord.maxX &&
                                    y >= coord.minY && y <= coord.maxY &&
                                    z >= coord.minZ && z <= coord.maxZ) {
                                    return true;
                                }
                            }
                            return false;
                        }

                        for (var x = startX; x <= endX; x++) {
                            for (var y = startY; y <= endY; y++) {
                                for (var z = startZ; z <= endZ; z++) {
                                    if (isExcluded(x, y, z, world.getName())) continue;

                                    var block = world.getBlockAt(x, y, z);
                                    if (isValidBlock(block, includeSolid, includeFluid, excludeAir, blockList, blockDataList, highestOffset)) {
                                        validBlocks.push(block);
                                    }
                                }
                            }
                        }

                        for (var i = 0; i < includedCoords.length; i++) {
                            var coord = includedCoords[i];
                            var coordWorld = Bukkit.getWorld(coord.world);
                            if (!coordWorld) continue;

                            for (var x = coord.minX; x <= coord.maxX; x++) {
                                for (var y = coord.minY; y <= coord.maxY; y++) {
                                    for (var z = coord.minZ; z <= coord.maxZ; z++) {
                                        var block = coordWorld.getBlockAt(x, y, z);
                                        validBlocks.push(block);
                                    }
                                }
                            }
                        }

                        if (validBlocks.length === 0) return "NoValidBlocks";

                        var block = validBlocks[Math.floor(Math.random() * validBlocks.length)];

                        var output = parts.slice(6).join("_");
                        var result = [];
                        if (output.indexOf("_type") !== -1) result.push(block.getType().toString());
                        if (output.indexOf("_world") !== -1) result.push(block.getWorld().getName().toString());
                        if (output.indexOf("_x") !== -1) result.push(block.getX());
                        if (output.indexOf("_y") !== -1) result.push(block.getY());
                        if (output.indexOf("_z") !== -1) result.push(block.getZ());

                        return result.join(",");
                    }
                }
                return "InvalidArgument";
            }
            
            function parseCoordsList(identifier) {
                var list = [];
                var match = identifier.match(/coords=([^;]*)/);
                if (!match) return list;

                var entries = match[1].split("|");
                entries.forEach(function(entry) {
                    var negate = entry.startsWith("!");
                    if (negate) entry = entry.substring(1);

                    var parts = entry.split("~");
                    if (parts.length === 1) {
                        var single = parts[0].split(",");
                        if (single.length === 4) {
                            list.push({
                                negate: negate,
                                world: single[0].replaceAll("ᵕ", "_"),
                                minX: parseInt(single[1]),
                                minY: parseInt(single[2]),
                                minZ: parseInt(single[3]),
                                maxX: parseInt(single[1]),
                                maxY: parseInt(single[2]),
                                maxZ: parseInt(single[3])
                            });
                        }
                    } else if (parts.length === 2) {
                        var from = parts[0].split(",");
                        var to = parts[1].split(",");
                        if (from.length === 4 && to.length === 3) {
                            list.push({
                                negate: negate,
                                world: from[0].replaceAll("ᵕ", "_"),
                                minX: Math.min(parseInt(from[1]), parseInt(to[0])),
                                minY: Math.min(parseInt(from[2]), parseInt(to[1])),
                                minZ: Math.min(parseInt(from[3]), parseInt(to[2])),
                                maxX: Math.max(parseInt(from[1]), parseInt(to[0])),
                                maxY: Math.max(parseInt(from[2]), parseInt(to[1])),
                                maxZ: Math.max(parseInt(from[3]), parseInt(to[2]))
                            });
                        }
                    }
                });
                return list;
            }

            function isValidBlock(block, includeSolid, includeFluid, excludeAir, blockList, blockDataList, highestOffset) {
                var type = block.getType().toString();
                var data = block.getBlockData().getAsString();
                var x = block.getX();
                var y = block.getY();
                var z = block.getZ();
                var highestY = world.getHighestBlockYAt(x, z);
                var targetY = highestOffset ? highestY + highestOffset : null;
                
                if (!includeSolid && !includeFluid && !excludeAir && blockList.length === 0 && blockDataList.length === 0 && !highestOffset) {
                    return true;
                }

                if (targetY !== null && y !== targetY) return false;
                if (excludeAir && type === "AIR") return false;

                var isFluid = block.isLiquid();
                var matchedByBlocks = false;
                var deniedByBlocks = false;

                for (var i = 0; i < blockList.length; i++) {
                    var entry = blockList[i].trim();
                    var negate = false;

                    if (entry.startsWith("!")) {
                        negate = true;
                        entry = entry.substring(1).trim();
                    }

                    var match = false;
                    if (entry.startsWith("contains ")) {
                        match = type.indexOf(entry.substring("contains ".length).trim()) !== -1;
                    } else if (entry.startsWith("startsWith ")) {
                        match = type.startsWith(entry.substring("startsWith ".length).trim());
                    } else if (entry.startsWith("endsWith ")) {
                        match = type.endsWith(entry.substring("endsWith ".length).trim());
                    } else {
                        match = type === entry;
                    }

                    if (match) {
                        if (negate) deniedByBlocks = true;
                        else matchedByBlocks = true;
                    }
                }

                var matchedByData = false;
                var deniedByData = false;

                for (var i = 0; i < blockDataList.length; i++) {
                    var entry = blockDataList[i].trim();
                    var negate = false;

                    if (entry.startsWith("!")) {
                        negate = true;
                        entry = entry.substring(1).trim();
                    }

                    var match = false;
                    if (entry.startsWith("contains ")) {
                        match = data.indexOf(entry.substring("contains ".length).trim()) !== -1;
                    } else if (entry.startsWith("startsWith ")) {
                        match = data.startsWith(entry.substring("startsWith ".length).trim());
                    } else if (entry.startsWith("endsWith ")) {
                        match = data.endsWith(entry.substring("endsWith ".length).trim());
                    } else {
                        match = data === entry;
                    }

                    if (match) {
                        if (negate) deniedByData = true;
                        else matchedByData = true;
                    }
                }

                if (deniedByBlocks || deniedByData) return false;

                var matchedPositive = false;

                if (includeSolid && !isFluid) matchedPositive = true;
                if (includeFluid && isFluid) matchedPositive = true;
                if (matchedByBlocks || matchedByData) matchedPositive = true;

                var anyFilterSpecified =
                    includeSolid || includeFluid ||
                    blockList.length > 0 || blockDataList.length > 0 || excludeAir || highestOffset !== null;

                if (anyFilterSpecified && !matchedPositive) return false;

                return true;
            }
            
            // ===================== BIOME BY COORDS ===================== //
            
            if (identifier.startsWith("biome_")) {
                var coords = identifier.substring("biome_".length).split("_");
                if (coords.length >= 4) {
                    var worldName = coords.slice(0, coords.length - 3).join("_");
                    var x = parseInt(coords[coords.length - 3]);
                    var y = parseInt(coords[coords.length - 2]);
                    var z = parseInt(coords[coords.length - 1]);

                    var world = Bukkit.getWorld(worldName);
                    if (world != null) {
                        return world.getBiome(x, y, z).toString();
                    } else {
                        return "InvalidWorld";
                    }
                }
                return "InvalidCoords";
            }
            
            // ===================== ENTITIES IN RADIUS ===================== //
            
            function getEntitiesInRadius(world, x, y, z, radius, include, filters) {
                var location = new Location(world, x, y, z);
                var entities = world.getNearbyEntities(location, radius, radius, radius).stream();

                if (filters == null || filters.length === 0) {
                    return entities.filter(function(entity) { if (!include && entity === player) return false; return true; }).collect(Collectors.toList());
                }
                
                return entities.filter(function(entity) {
                    	if (filters.some(function(filter) {
                            var newFilter = filter.replaceAll("-", "_");
                            if (newFilter === "PLAYER" && newFilter === entity.getType().toString()) {
                            	if (include && entity == player) return true;
                            	if (!include && entity != player) return true;
                                return false;
                            }
                            if (entity.getBlockData) return newFilter === entity.getBlockData().getMaterial().toString();
                            return newFilter === entity.getType().toString();
                        })) return true;
                    	if (filters.some(function(filter) {
                            var newFilter = filter.replaceAll("-", "_");
                            if (entity.getBlockData) return newFilter.substring(1) === entity.getBlockData().getMaterial().toString() && newFilter.charAt(0) === "!";
                            return newFilter.substring(1) === entity.getType().toString() && newFilter.charAt(0) === "!";
                        })) return false;
                        if (filters.indexOf("players") !== -1 && entity instanceof Player) {
                            if (include && entity == player) return true;
                            if (!include && entity != player) return true;
                        }
                        if (filters.indexOf("mobs") !== -1 && entity instanceof LivingEntity && !(entity instanceof Player)) return true;
                        if (filters.indexOf("items") !== -1 && entity instanceof Item) return true;
                        if (filters.indexOf("vehicles") !== -1 && entity instanceof Vehicle) return true;
                        if (filters.indexOf("projectiles") !== -1 && entity instanceof Projectile) return true;
                    	if (filters.indexOf("hanging") !== -1 && entity instanceof Hanging) return true;
                    	if (filters.indexOf("falling") !== -1 && entity instanceof FallingBlock) return true;
                    	if (filters.indexOf("tnt") !== -1 && entity instanceof TNTPrimed) return true;
                        return false;
                    })
                    .collect(Collectors.toList());
            }
            
            function syncGetEntitiesInRadius(world, x, y, z, radius, include, filters) {
                if (Bukkit.isPrimaryThread()) {
                    return getEntitiesInRadius(world, x, y, z, radius, include, filters);
                }

                var result = new java.util.concurrent.atomic.AtomicReference();
                var latch = new java.util.concurrent.CountDownLatch(1);

                var runnable = new Runnable({
                    run: function () {
                        try {
                            result.set(getEntitiesInRadius(world, x, y, z, radius, include, filters));
                        } finally {
                            latch.countDown();
                        }
                    }
                });

                Bukkit.getScheduler().runTask(plugin, runnable);

                latch.await();
                return result.get();
            }

            if (identifier.startsWith("entitiesInRadius_")) {
                var args = identifier.substring("entitiesInRadius_".length).split("_");
                if (args.length < 7) return "InvalidArgs";
					
                var worldName = args.slice(0, args.length - 6).join("_");
                var x = parseFloat(args[args.length - 6]);
                var y = parseFloat(args[args.length - 5]);
                var z = parseFloat(args[args.length - 4]);
                var radius = parseFloat(args[args.length - 3]);
                var include = args[args.length - 2] === "true";
                if (player == null) include = false;
                var filters = args[args.length - 1] !== "" ? args.slice(args.length - 1)[0].split(",") : null;

                var world = Bukkit.getWorld(worldName);
                var entities = syncGetEntitiesInRadius(world, x, y, z, radius, include, filters);
                return entities.size() > 0 ? "true" : "false";
            }

            if (identifier.startsWith("entitiesCountInRadius_")) {
                var args = identifier.substring("entitiesCountInRadius_".length).split("_");
                if (args.length < 7) return "InvalidArgs";

                var worldName = args.slice(0, args.length - 6).join("_");
                var x = parseFloat(args[args.length - 6]);
                var y = parseFloat(args[args.length - 5]);
                var z = parseFloat(args[args.length - 4]);
                var radius = parseFloat(args[args.length - 3]);
                var include = args[args.length - 2] === "true";
                if (player == null) include = false;
                var filters = args[args.length - 1] !== "" ? args.slice(args.length - 1)[0].split(",") : null;
                
                var world = Bukkit.getWorld(worldName);
                var entities = syncGetEntitiesInRadius(world, x, y, z, radius, include, filters);
                return entities.size();
            }

            if (identifier.startsWith("entitiesListInRadius_")) {
                var args = identifier.substring("entitiesListInRadius_".length).split("_");
                if (args.length < 8) return "InvalidArgs";
				
                var worldName = args.slice(0, args.length - 7).join("_");
                var x = parseFloat(args[args.length - 7]);
                var y = parseFloat(args[args.length - 6]);
                var z = parseFloat(args[args.length - 5]);
                var radius = parseFloat(args[args.length - 4]);
                var attribute = args[args.length - 3];
                var include = args[args.length - 2] === "true";
                if (player == null) include = false;
                var filters = args[args.length - 1] !== "" ? args.slice(args.length - 1)[0].split(",") : null;

                var world = Bukkit.getWorld(worldName);
                var entities = syncGetEntitiesInRadius(world, x, y, z, radius, include, filters);

                if (attribute == "uuid") {
                    return entities.stream()
                        .map(function(e) { return e.getUniqueId().toString(); })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "type") {
                    return entities.stream()
                        .map(function(e) { return e.getType().name(); })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "type,type") {
                    return entities.stream()
                        .map(function(e) { return e.getBlockData ? e.getBlockData().getMaterial().name() : e.getType().name(); })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "enum") {
                    return entities.stream()
                        .map(function(e) { return e.toString(); })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "name") {
                    return entities.stream()
                        .map(function(e) { return e.getName ? e.getName() : "Unknown"; })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "coords") {
                    return entities.stream()
                        .map(function(e) { return e.getWorld().getName() + ";" + e.getLocation().getX() + ";" + e.getLocation().getY() + ";" + e.getLocation().getZ(); })
                        .collect(Collectors.joining(","));
                }

                return "InvalidAttribute";
            }

            if (identifier.startsWith("entityAtIndexInRadius_")) {
                var args = identifier.substring("entityAtIndexInRadius_".length).split("_");
                if (args.length < 9) return "InvalidArgs";
				
                var worldName = args.slice(0, args.length - 8).join("_");
                var x = parseFloat(args[args.length - 8]);
                var y = parseFloat(args[args.length - 7]);
                var z = parseFloat(args[args.length - 6]);
                var radius = parseFloat(args[args.length - 5]);
                var index = parseInt(args[args.length - 4]);
                var attribute = args[args.length - 3];
                var include = args[args.length - 2] === "true";
                if (player == null) include = false;
                var filters = args[args.length - 1] !== "" ? args.slice(args.length - 1)[0].split(",") : null;

                var world = Bukkit.getWorld(worldName);
                var entities = syncGetEntitiesInRadius(world, x, y, z, radius, include, filters);

                if (index < 0 || index >= entities.size()) return "OutOfBounds";
                var entity = entities.get(index);

                if (attribute == "uuid") return entity.getUniqueId().toString();
                if (attribute == "type") return entity.getType().name();
                if (attribute == "type,type") return entity.getBlockData ? entity.getBlockData().getMaterial().name() : entity.getType().name();
                if (attribute == "enum") return entity.toString();
                if (attribute == "name") return entity.getName ? entity.getName() : "Unknown";
                if (attribute == "coords") return entity.getWorld().getName() + ";" + entity.getLocation().getX() + ";" + entity.getLocation().getY() + ";" + entity.getLocation().getZ();

                return "InvalidAttribute";
            }
            
            // ===================== ARRAY PROCESSING FEATURES ===================== //
            
            if (identifier.startsWith("array_")) {
                function splitTailOutsidePlaceholders(input, tailCount) {
                    var underscores = [];
                    var depth = 0;
                    for (var i = 0; i < input.length; i++) {
                        var c = input.charAt(i);
                        var next = input.charAt(i + 1);

                        if (c === "\\" && (next === "$" || next === "@")) { i++; continue; }
                        if (c === "$") { depth++; continue; }
                        if (c === "@") { depth = Math.max(0, depth - 1); continue; }
                        if (c === "_" && depth === 0) { underscores.push(i); }
                    }
                    if (tailCount === 0) return { head: input, tails: [] };
                    if (underscores.length < tailCount) return null;

                    var headEnd = underscores[underscores.length - tailCount];
                    var head = input.substring(0, headEnd);
                    var tails = [];
                    for (var k = underscores.length - tailCount; k < underscores.length; k++) {
                        var from = underscores[k] + 1;
                        var to = (k + 1 < underscores.length) ? underscores[k + 1] : input.length;
                        tails.push(input.substring(from, to));
                    }
                    return { head: head, tails: tails };
                }

                var withoutPrefix = identifier.substring("array_".length);

                var sepEnd = withoutPrefix.indexOf("_");
                if (sepEnd === -1) return "InvalidParameters";
                var separator = withoutPrefix.substring(0, sepEnd);

                var afterSep = withoutPrefix.substring(sepEnd + 1);
                var opEnd = afterSep.indexOf("_");
                if (opEnd === -1) return "InvalidParameters";
                var operation = afterSep.substring(0, opEnd).toUpperCase();
                var rest = afterSep.substring(opEnd + 1);

                function makeArray(str) { return str ? str.replaceAll("␠", " ").split(separator) : []; }

                function evaluateCondition(val, conditionRaw) {
                    conditionRaw = conditionRaw.replaceAll("ᵕ", "_");
                    conditionRaw = conditionRaw.replaceAll("␠", " ");
                    conditionRaw = conditionRaw.replace(/\$val@/g, val);

                    var exprTree = null;
                    if (conditionRaw.trim().length > 0) {
                        exprTree = parseExpression(conditionRaw);
                        if (!exprTree) return false;
                    }
                    return evaluateExpression(null, exprTree);
                }

                var array, startIndex, endIndex, value, newValue;

                switch (operation) {
                    case "GET":
                    case "G":
                        array = makeArray(rest);
                        return array.join(separator);
                    case "GET-LENGTH":
                	case "GL":
                        array = makeArray(rest);
                        return array.length.toString();
                    case "GET-BY-INDEX":
                	case "GBI":
                        var sp = splitTailOutsidePlaceholders(rest, 1);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        startIndex = sp.tails[0] === "~" ? array.length - 1 : parseInt(sp.tails[0]);
                        return array[startIndex] || "";
                    case "GET-PART":
                	case "GP":
                        var sp = splitTailOutsidePlaceholders(rest, 2);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        startIndex = sp.tails[0] === "~" ? array.length - 1 : parseInt(sp.tails[0]);
                        endIndex   = sp.tails[1] === "~" ? array.length - 1 : parseInt(sp.tails[1]);
                        startIndex = Math.max(0, Math.min(startIndex, array.length - 1));
                        endIndex   = Math.max(0, Math.min(endIndex,   array.length - 1));
                        if (startIndex > endIndex) { var t = startIndex; startIndex = endIndex; endIndex = t; }
                        return array.slice(startIndex, endIndex + 1).join(separator);
                    case "GET-COUNT-BY-VALUE":
                	case "GCBV":
                        var sp = splitTailOutsidePlaceholders(rest, 1);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        value = sp.tails[0];
                        var count = 0;
                        for (var i = 0; i < array.length; i++) if (evaluateCondition(array[i], value)) count++;
                        return count.toString();
                    case "GET-INDEXES-BY-VALUE":
                    case "GIBV":
                        var sp = splitTailOutsidePlaceholders(rest, 1);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        value = sp.tails[0];
                        var indexes = [];
                        for (var i = 0; i < array.length; i++) if (evaluateCondition(array[i], value)) indexes.push(i);
                        return indexes.join(separator);
                    case "CHECK":
                	case "C":
                        var sp = splitTailOutsidePlaceholders(rest, 1);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        value = sp.tails[0];
                        return array.some(function (v) { return evaluateCondition(v, value); }) ? "true" : "false";
                    case "ADD-BY-INDEX":
                	case "ABI":
                        var sp = splitTailOutsidePlaceholders(rest, 2);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        startIndex = sp.tails[0] === "~" ? array.length : parseInt(sp.tails[0]);
                        value = sp.tails[1].replaceAll("ᵕ", "_");
                        array.splice(startIndex, 0, value);
                        return array.join(separator);
                    case "SET-BY-INDEX":
                	case "SBI":
                        var sp = splitTailOutsidePlaceholders(rest, 2);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        startIndex = sp.tails[0] === "~" ? array.length - 1 : parseInt(sp.tails[0]);
                        value = sp.tails[1].replaceAll("ᵕ", "_");
                        array[startIndex] = value;
                        return array.join(separator);
                    case "SET-BY-VALUE":
                	case "SBV":
                        var sp = splitTailOutsidePlaceholders(rest, 2);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        value = sp.tails[0];
                        newValue = sp.tails[1].replaceAll("ᵕ", "_").replaceAll("␠", " ");;
                        if (value && newValue) {
                            for (var i = 0; i < array.length; i++) {
                                if (evaluateCondition(array[i], value)) array[i] = newValue;
                            }
                        }
                        return array.join(separator);
                    case "SET-RANGE":
                	case "SR":
                        var sp = splitTailOutsidePlaceholders(rest, 3);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        startIndex = sp.tails[0] === "~" ? array.length - 1 : parseInt(sp.tails[0]);
                        endIndex   = sp.tails[1] === "~" ? array.length - 1 : parseInt(sp.tails[1]);
                        value      = sp.tails[2].replaceAll("ᵕ", "_");
                        startIndex = Math.max(0, Math.min(startIndex, array.length - 1));
                        endIndex   = Math.max(0, Math.min(endIndex,   array.length - 1));
                        if (startIndex > endIndex) { var t = startIndex; startIndex = endIndex; endIndex = t; }
                        if (value) for (var i = startIndex; i <= endIndex; i++) array[i] = value;
                        return array.join(separator);
                    case "REMOVE-BY-INDEX":
                	case "RBI":
                        var sp = splitTailOutsidePlaceholders(rest, 1);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        startIndex = sp.tails[0] === "~" ? array.length - 1 : parseInt(sp.tails[0]);
                        array.splice(startIndex, 1);
                        return array.join(separator);
                    case "REMOVE-BY-VALUE":
                	case "RBV":
                        var sp = splitTailOutsidePlaceholders(rest, 1);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        value = sp.tails[0];
                        var newArray = [];
                        for (var i = 0; i < array.length; i++) if (!evaluateCondition(array[i], value)) newArray.push(array[i]);
                        return newArray.join(separator);
                    case "REMOVE-RANGE":
                	case "RR":
                        var sp = splitTailOutsidePlaceholders(rest, 2);
                        if (!sp) return "InvalidParameters";
                        array = makeArray(sp.head);
                        startIndex = sp.tails[0] === "~" ? array.length - 1 : parseInt(sp.tails[0]);
                        endIndex   = sp.tails[1] === "~" ? array.length - 1 : parseInt(sp.tails[1]);
                        startIndex = Math.max(0, Math.min(startIndex, array.length - 1));
                        endIndex   = Math.max(0, Math.min(endIndex,   array.length - 1));
                        if (startIndex > endIndex) { var t = startIndex; startIndex = endIndex; endIndex = t; }
                        array.splice(startIndex, endIndex - startIndex + 1);
                        return array.join(separator);
                    default:
                        return "InvalidAction";
                }
            }
            
            // ===================== GET REAL NAME FROM ESSENTIALS CUSTOM NAME ===================== //
            
            if (identifier.startsWith("realname")) {
                if (!essentialsPlugin) {
                	return "EssetialsPluginIsMissing";
            	} else {
            		var FormatUtil = Java.type("com.earth2me.essentials.utils.FormatUtil");
                    var foundUser = false;
                    var target = null;

                    if (!identifier.startsWith("realname_")) {
                        foundUser = true;
                        target = player;
                    } else {
                        var lookup = identifier.substring("realname_".length).toLowerCase();
                        var onlinePlayers = Bukkit.getOnlinePlayers();
                        for (var i = 0; i < onlinePlayers.size(); i++) {
                            var currentPlayer = onlinePlayers.get(i);
                            var displayName = FormatUtil.stripFormat(currentPlayer.getDisplayName()).toLowerCase();
                            var name = FormatUtil.stripFormat(currentPlayer.getName()).toLowerCase();
                            if (lookup.equalsIgnoreCase(displayName) || lookup.equalsIgnoreCase(name)) {
                                foundUser = true;
                                target = currentPlayer;
                                break;
                            }
                        }
                    }

                    if (foundUser && target != null) {
                        return target.getName();
                    } else {
                        return "PlayerNotFound";
                    }
                }
            }
            
            // ===================== WORKING WITH TEAMS ===================== //
            
            if (identifier.startsWith("team_")) {
                var parts = identifier.substring("team_".length).split("_");
                if (parts.length < 2) return "InvalidArguments";

                var target = parts.slice(0, parts.length - 1).join("_");
                var action = parts[parts.length - 1];

                var scoreboard = Bukkit.getScoreboardManager().getMainScoreboard();
                var team = scoreboard.getTeam(target);

                if (team == null) {
                    var entity;
                    try {
                        var uuid = UUID.fromString(target);
                        entity = getEntitySync(uuid);
                    } catch (e) {
                        entity = null;
                    }
                    if (entity != null) {
                        team = scoreboard.getEntryTeam(entity.getUniqueId().toString());
                    }
                }

                if (team == null) {
                    var player = getPlayerSync(target, false);
                    if (player != null) {
                        team = scoreboard.getEntryTeam(player.getName());
                    }
                }

                if (team == null) return "NotInTeam";

                switch (action) {
                    case "name":
                        return team.getName();
                    case "size":
                        return team.getSize().toString();
                    case "members":
                        var members = [];
                        var iterator = team.getEntries().iterator();
                        while (iterator.hasNext()) {
                            members.push(iterator.next());
                        }
                        return members.join(", ");
                    case "color":
                        return team.getColor() ? team.getColor().name() : "NONE";
                    case "prefix":
                        return team.getPrefix();
                    case "suffix":
                        return team.getSuffix();
                    case "visibility":
                        return team.getOption(org.bukkit.scoreboard.Team.Option.NAME_TAG_VISIBILITY).name();
                    case "collision":
                        return team.getOption(org.bukkit.scoreboard.Team.Option.COLLISION_RULE).name();
                    default:
                        return "UnknownAction";
                }
            }
                        
            // ===================== WORKING WITH CUSTOM DATA ===================== //
            
            if (identifier.startsWith("customData_")) {
                var args = identifier.substring("customData_".length).split("_");
                var temp = args[0].startsWith("temp");
                var action = temp ? args[0].substring("temp".length) : args[0];
                var name = args[1];
                var state = action === "set" || action === "getset" || action === "increase" || action === "decrease" || action === "multiply" || action === "divide";
                var data = (state) && args[2] ? args[2].replaceAll("ᵕ", "_") : null;
                var targetIdentifier = args[state ? 3 : 2] && args[state ? 3 : 2] !== "" ? args.slice(state ? 3 : 2).join("_") : null;
                
                if (state && !data) return "InvalidData";
				
                function createData(json, name, data, target) {
                    function isEmptyPlainObject(value) {
                        return (
                            typeof value === 'object' &&
                            value !== null &&
                            !Array.isArray(value) &&
                            Object.keys(value).length === 0
                        );
                    }
                     
                    if (!json.CEAAPP) json.CEAAPP = {};
                    if (!json.CEAAPP.CEPlaceholders) json.CEAAPP.CEPlaceholders = {};
                    if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder) json.CEAAPP.CEPlaceholders.CustomDataPlaceholder = {};

                    if (!target) {
                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData = {};
                        }

                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name]) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name] = {};
                        }

                        if (isEmptyPlainObject(json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name]) &&
                            !data) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name] = null;
                        }

                        if (data) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name] = data;
                        }

                    } else {
                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData = {};
                        }

                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target]) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target] = {};
                        }

                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name]) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] = {};
                        }

                        if (isEmptyPlainObject(json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name]) &&
                            !data) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] = null;
                        }

                        if (data) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] = data;
                        }
                    }

                    return json;
                }
                
                function loadData(file) {
                    var fileReader = new java.util.Scanner(file);
                    var jsonContent = fileReader.useDelimiter("\\Z").next();
                    fileReader.close();
                    return JSON.parse(jsonContent);
                }

                function saveData(file, json) {
                    var writer = new java.io.FileWriter(file, false);
                    writer.write(JSON.stringify(json, null, 2));
                    writer.close();
                }
                
                if (!targetIdentifier) {
                    switch (action) {
                        case "increase":
                        case "decrease":
                        case "multiply":
                        case "divide":
                            data = parseFloat(data);
                            if (temp) {
                                var savedData = Number(customDataTempGlobalData.get(name) || "NoData");
                                if (!isNaN(savedData) && !isNaN(data)) {
                                    switch (action) {
                                        case "increase":
                                            data = savedData + data;
                                            break;
                                        case "decrease":
                                            data = savedData - data;
                                            break;
                                        case "multiply":
                                            data = savedData * data;
                                            break;
                                        case "divide":
                                            if (data === 0) return "CanNotDivideByZero";
                                            else data = savedData / data;
                                            break;
                                        default:
                                            break;
                                    }
                            		customDataTempGlobalData.put(name, data);
                                } else return "NotANumber";
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
                                
                                json = createData(json, name, null, null);
                                
                                var savedData = Number(json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name] || "NoData");
                                if (!isNaN(savedData) && !isNaN(data)) {
                                    switch (action) {
                                        case "increase":
                                            data = savedData + data;
                                            break;
                                        case "decrease":
                                            data = savedData - data;
                                            break;
                                        case "multiply":
                                            data = savedData * data;
                                            break;
                                        case "divide":
                                            if (data === 0) return "CanNotDivideByZero";
                                            else data = savedData / data;
                                            break;
                                        default:
                                            break;
                                    }
                                    json = createData(json, name, data, null);
                                    saveData(file, json);
                                } else return "NotANumber";
                            }
                            return data;
                        case "set":
                            if (temp) {
                            	customDataTempGlobalData.put(name, data);
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
								
                                json = createData(json, name, data, null);
                                
                                saveData(file, json);
                            }
                            return data;
                        case "get":
                            if (temp) {
                            	return customDataTempGlobalData.get(name) || "NoData";
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
								
                                json = createData(json, name, null, null);
                                
                                return json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name] || "NoData";
                            }
                        case "getset":
                            if (temp) {
                                var output = customDataTempGlobalData.get(name);
                                if (output) {
                                    return output;
                                } else {
                            		customDataTempGlobalData.put(name, data);
                                    return data;
                                }
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
                                json = createData(json, name, null, null);
								
                                var output = json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name];
                                if (output) {
                                    return output;
                                } else {
                            		json = createData(json, name, data, null);
                                	
                                    saveData(file, json);
                                    return data;
                                }
                            }
                        case "remove":
                            if (temp) {
                            	return customDataTempGlobalData.remove(name) ? true : false;
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
								
                                json = createData(json, name, null, null);
                                
                                var output = json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name];
                                if (output) {
                                	delete json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name];
                                	saveData(file, json);
                                    return true;
                                }
                                return false;
                            }
                        default:
                            return "InvalidAction";
                    }
                } else {
                    var target = null;
                    if (targetIdentifier.indexOf(",") !== -1) {
                        var parts = targetIdentifier.split(",");
                        if (parts.length === 4) {
                            var world = Bukkit.getWorld(parts[0]);
                            var x = parseFloat(parts[1]);
                            var y = parseFloat(parts[2]);
                            var z = parseFloat(parts[3]);
                            
                            try {
                            	target = world.getBlockAt(x, y, z);
                            } catch (e) {
                                return "InvalidLocation";
                            }
                        } else {
                            return "InvalidLocation";
                        }
                    } else {
                        try {
                            var uuid = UUID.fromString(targetIdentifier);
                            var entity = getEntitySync(uuid);
                            target = entity ? uuid : null;
                        } catch (e) {
                            target = getPlayerSync(targetIdentifier, true);
                        }
                    }
                    
                    if (!target) return "InvalidTarget";
                    
                    switch (action) {
                        case "increase":
                        case "decrease":
                        case "multiply":
                        case "divide":
                            data = parseFloat(data);
                            if (temp) {
                                var targetData = customDataTempTargetsData.get(target) || new HashMap();
                                var savedData = Number(targetData.get(name) || "NoData");
                                if (!isNaN(savedData) && !isNaN(data)) {
                                    switch (action) {
                                        case "increase":
                                            data = savedData + data;
                                            break;
                                        case "decrease":
                                            data = savedData - data;
                                            break;
                                        case "multiply":
                                            data = savedData * data;
                                            break;
                                        case "divide":
                                            if (data === 0) return "CanNotDivideByZero";
                                            else data = savedData / data;
                                            break;
                                        default:
                                            break;
                                    }
                            		targetData.put(name, data);
                                	customDataTempTargetsData.put(target, targetData);
                                } else return "NotANumber";
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
                                                                
                                var savedData = Number(json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target] && json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] ? json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] : "NoData");
                                if (!isNaN(savedData) && !isNaN(data)) {
                                    switch (action) {
                                        case "increase":
                                            data = savedData + data;
                                            break;
                                        case "decrease":
                                            data = savedData - data;
                                            break;
                                        case "multiply":
                                            data = savedData * data;
                                            break;
                                        case "divide":
                                            if (data === 0) return "CanNotDivideByZero";
                                            else data = savedData / data;
                                            break;
                                        default:
                                            break;
                                    }
                                    json = createData(json, name, data, target);
                                    saveData(file, json);
                                } else return "NotANumber";
                            }
                            return data;
                        case "set":
                            if (temp) {
                                var targetData = customDataTempTargetsData.get(target) || new HashMap();
                                targetData.put(name, data);
                                customDataTempTargetsData.put(target, targetData);
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }

                                json = createData(json, name, data, target);

                                saveData(file, json);
                            }
                            return data;
                        case "get":
                            if (temp) {
                                return customDataTempTargetsData.get(target) && customDataTempTargetsData.get(target).get(name) ? customDataTempTargetsData.get(target).get(name) : "NoData";
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }

                                return json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target] && json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] ? json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] : "NoData";
                            }
                        case "getset":
                            if (temp) {
                                var targetData = customDataTempTargetsData.get(target) || new HashMap();
                                var output = targetData.get(name);
                                if (output) {
                                    return output;
                                } else {
                            		targetData.put(name, data);
                                	customDataTempTargetsData.put(target, targetData);
                                    return data;
                                }
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
                                json = createData(json, name, null, target);
                                
                                var output = json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name];
                                if (output) {
                                    return output;
                                } else {
                            		json = createData(json, name, data, target);
                                	
                                    saveData(file, json);
                                    return data;
                                }
                            }
                        case "remove":
                            if (temp) {
                            	return customDataTempTargetsData.get(target) ? customDataTempTargetsData.get(target).remove(name) ? true : false : false;
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
								
                                json = createData(json, name, null, target);
                                
                                var output = json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name];
                                if (output) {
                                	delete json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name];
                                	saveData(file, json);
                                    return true;
                                }
                                return false;
                            }
                        default:
                            return "InvalidAction";
                    }
                }
            }
            
            // ===================== GET DIFFERENT ENTITY INFORMATION ===================== //
            
            if (identifier.startsWith("entity_")) {
				var args = identifier.substring("entity_".length).split("_");
                if (args.length < 2) return "InvalidArguments";
                var action = args[0].trim();
                var separator = args[1];
                var targetIdentifier = args.length > 2 && args[2] !== "" ? args.slice(2).join("_") : player.getName();
				
                if (action.startsWith("path") || action.startsWith("hasPath")) {
                    try {
                        var PathFinder = Java.type("com.destroystokyo.paper.entity.Pathfinder");
                    } catch (e) {
                        return "OnlyForPaperAndAbove";
                    }
                }
                
                var target = null;
                
                if (action.startsWith("realUUID")) {
                    target = getPlayerSync(targetIdentifier, false);
                    if (!target) {
                        try {
                            var uuid = UUID.fromString(targetIdentifier);
                            target = getPlayerSync(uuid, true);
                        } catch (e) {
                            target = getPlayerSync(targetIdentifier, true);
                        }
                    }
                } else {
                    try {
                        var uuid = UUID.fromString(targetIdentifier);
                        target = getEntitySync(uuid);
                    } catch (e) {
                        target = getPlayerSync(targetIdentifier, false);
                    }
                }

                if (!target) return "EntityNotFound";
                
                function getTaskForUUID(uuidString, last) {
                    var file = new java.io.File("plugins/TriggerReactor/tasks.json");
                    if (!file.exists()) return null;

                    var fileReader = new java.util.Scanner(file);
                    var jsonContent = fileReader.useDelimiter("\\Z").next();
                    fileReader.close();

                    var json = JSON.parse(jsonContent);

                    if (
                        json &&
                        json.SavedTasks &&
                        json.SavedTasks.Points &&
                        json.SavedTasks.Points[uuidString]
                    ) {
                        var points = json.SavedTasks.Points[uuidString];
                        if (!points || points.length === 0) return "";

                        if (last) {
                            var p = points[points.length - 1];
                            return p.world + separator + p.x + separator + p.y + separator + p.z + separator + p.pitch + separator + p.yaw;
                        } else {
                            return points.map(function (p) { return p.world + ";" + p.x + ";" + p.y + ";" + p.z + ";" + p.pitch + ";" + p.yaw }).join(separator);
                        }
                    }

                    return "NoPath";
                }
                
                if (action.startsWith("isOnFire:")) {
                    var parts = action.split(":");
                    action = parts[0];
                    var state = parts[1];
                }
                
                if (action.startsWith("location:")) {
                    var parts = action.split(":");
                    action = parts[0];
                    var coords = parts[1] ? parts[1].split(",") : null;
                }
                
                if (action.startsWith("passengers:") || action.startsWith("target:") || action.startsWith("path:") || action.startsWith("velocity:") || action.startsWith("openInventoryOwner:") || action.startsWith("openInvOwner:") || action.startsWith("realUUID:")) {
                    var parts = action.split(":");
                    action = parts[0];
                    var attribute = parts[1];
                }
                
                if (action.startsWith("workBlock:")) {
                    var parts = action.split(":");
                    action = parts[0];
                    var attribute = parts.slice(1).join(":");
                }
                
                if (action.startsWith("canSee:")) {
                    var parts = action.split(":");
                    action = parts[0];
                    var targetEntity = null;
                    try {
                        var uuid = UUID.fromString(parts[1]);
                        targetEntity = getEntitySync(uuid);
                    } catch (e) {
                        targetEntity = getPlayerSync(parts[1], false);
                    }
                }
                
                if (action.startsWith("targetBlock:")) {
                    var parts = action.split(":");
                    action = parts[0];
                    if (parts.length < 5) return "InvalidAttributes";
                    var output = parts[1].trim();
                    var skipBlocks = parts[2] ? parts[2].replaceAll("-", "_").split(",") : null;
                    var distance = parseInt(parts[3]);
                    var fluids = null;
                    try {
                    	fluids = org.bukkit.FluidCollisionMode.valueOf(parts[4].replaceAll("-", "_").trim().toUpperCase());
                    } catch (e) {
                        fluids = org.bukkit.FluidCollisionMode.ALWAYS;
                    }
                }
                
                if (action.startsWith("targetEntity:")) {
                    var parts = action.split(":");
                    action = parts[0];
                    if (parts.length < 4) return "InvalidAttributes";
                    var output = parts[1].trim();
                    var distance = parseFloat(parts[2]);
                    var raySize = parseFloat(parts[3]);
                }
                
                switch (action) {
                    case "type":
                        return target.getType().name();
                    case "name":
                        return target.getName ? target.getName() : "Unknown";
                    case "enum":
                        return target.toString();
                    case "maxAir":
                        if (target instanceof LivingEntity) {
                        	return target.getMaximumAir();
                        }
                        return "TargetIsNotLivingEntity";
                    case "currentAir":
                        if (target instanceof LivingEntity) {
                        	return target.getRemainingAir();
                        }
                        return "TargetIsNotLivingEntity";
                    case "walkSpeed":
                    	if (target instanceof Player) {
                        	return target.getWalkSpeed();
                        }
                        return "TargetIsNotPlayer";
                    case "flySpeed":
                    	if (target instanceof Player) {
                        	return target.getFlySpeed();
                        }
                        return "TargetIsNotPlayer";
                    case "ticksLived":
                    	return target.getTicksLived();
                    case "isGliding":
                        if (target instanceof LivingEntity) {
                        	return target.isGliding();
                        }
                        return "TargetIsNotLivingEntity";
                    case "isBlocking":
                        if (target instanceof HumanEntity) {
                        	return target.isBlocking();
                        }
                        return "TargetIsNotHumanEntity";
                    case "isHandRaised":
                        if (target instanceof HumanEntity) {
                        	return target.isHandRaised();
                        }
                        return "TargetIsNotHumanEntity";
                    case "currentHealth":
                        if (target instanceof Damageable) {
                            return target.getHealth().toFixed(2);
                        }
                        return "TargetIsNotDamageable";
                    case "maxHealth":
                        if (target instanceof Attributable) {
                            return target.getAttribute(Attribute.GENERIC_MAX_HEALTH).getValue().toFixed(2);
                        }
                        return "TargetIsNotAttributable";
                    case "isSwimming":
                        if (target instanceof LivingEntity) {
                            return target.isSwimming();
                        }
                        return "TargetIsNotLivingEntity";
                    case "isSitting":
                        if (target instanceof Sittable) {
                            return target.isSitting();
                        }
                        return "TargetIsNotSittable";
                    case "isInWater":
                        return target.isInWater();
                    case "isInLava":
                        var loc = target.getLocation();
    					var block = loc.getBlock();
    					var type = block.getType().toString();
    					return type.contains("LAVA");
                    case "isFrozen":
                        return target.isFrozen();
                    case "isOnFire":
                        switch (state) {
                            case "real":
                                return target.getFireTicks() > 0;
                            case "visual":
                                return target.isVisualFire();
                            default:
                        		return "InvalidState";    
                        }
                    case "fireTicks":
                        return target.getFireTicks();
                    case "location":
                        var output = [];
                        if (!coords) coords = ["world", "x", "y", "z", "yaw", "pitch"];
                        
                        coords.forEach(function(coord) {
                            switch (coord) {
                                case "world":
                                    output.push(target.getWorld().getName());
                                    break;
                                case "x":
                                    output.push(target.getLocation().getX());
                                    break;
                                case "y":
                                    output.push(target.getLocation().getY());
                                    break;
                                case "z":
                                    output.push(target.getLocation().getZ());
                                    break;
                                case "yaw":
                                    output.push(target.getLocation().getYaw());
                                    break;
                                case "pitch":
                                    output.push(target.getLocation().getPitch());
                                    break;
                                default:
                                    return "InvalidCoord";
                            }
                        });
                        
                        return output.join(separator);
                    case "passengers":
                        var passengers = target.getPassengers();
                		if (passengers.length === 0) return "NoPassengers";
                        
                        var result = "";
                        for (var i = 0; i < passengers.length; i++) {
                            var p = passengers[i];
                            var value;
                            switch (attribute) {
                                case "uuid":
                                    value = p.getUniqueId().toString();
                                    break;
                                case "type":
                                    value = p.getType().name();
                                    break;
                                case "enum":
                                    value = p.toString();
                                    break;
                                case "name":
                                    value = p.getName ? p.getName() : "Unknown";
                                    break;
                                case "coords":
                                    value = p.getWorld().getName() + ";" + p.getLocation().getX() + ";" + p.getLocation().getY() + ";" + p.getLocation().getZ();
                                    break;
                                default:
                                    return "InvalidAttribute";
                            }
                            if (i > 0) {
                                result += separator;
                            }
                            result += value;
                        }
                        
                        return result;
                    case "hasAI":
                        if (target instanceof LivingEntity) {
                            return target.hasAI();
                        }
                        return "TargetIsNotLivingEntity";
                    case "tags":
                    	return target.getScoreboardTags();
                    case "target":
                        if (target instanceof Mob) {
                            var value;
                            var e = target.getTarget();
                            if (!e) return "None";
                            switch (attribute) {
                                case "uuid":
                                    value = e.getUniqueId().toString();
                                    break;
                                case "type":
                                    value = e.getType().name();
                                    break;
                                case "enum":
                                    value = e.toString();
                                    break;
                                case "name":
                                    value = e.getName ? p.getName() : "Unknown";
                                    break;
                                case "coords":
                                    value = e.getWorld().getName() + separator+ e.getLocation().getX() + separator + e.getLocation().getY() + separator + e.getLocation().getZ();
                                    break;
                                default:
                                    return "InvalidAttribute";
                            }
                            return value;
                        }
                    	return "TargetIsNotMob";
                    case "inventory":
                    case "inv":
                        if (target instanceof InventoryHolder) {
                        	return target.getInventory().getType().toString();
                        }
                        return "TargetIsNotInventoryHolder";
                    case "openInventory":
                    case "openInv":
                        if (target instanceof HumanEntity) {
                        	return target.getOpenInventory().getType().toString();
                        }
                        return "TargetIsNotHumanEntity";
                    case "inventorySize":
                    case "invSize":
                        if (target instanceof InventoryHolder) {
                        	return target.getInventory().getSize();
                        }
                        return "TargetIsNotInventoryHolder";
                    case "openInventorySize":
                    case "openInvSize":
                        if (target instanceof HumanEntity) {
                        	return target.getOpenInventory().getTopInventory().getSize();
                        }
                        return "TargetIsNotHumanEntity";
                    case "openInventoryOwner":
                    case "openInvOwner":
                        if (target instanceof HumanEntity) {
                        	var holder = target.getOpenInventory().getTopInventory().getHolder();
                            if (!holder) return "None";
                            switch (attribute) {
                                case "uuid":
                                    return holder.getUniqueId ? holder.getUniqueId().toString() : "Unknown";
                                case "type":
                                    return holder.getType().name();
                                case "enum":
                                    return holder.toString();
                                case "name":
                                    return holder.getName ? holder.getName() : "Unknown";
                                case "coords":
                                    return holder && (!holder.isValid || (holder.isValid && holder.isValid())) ? (holder.getWorld().getName() + separator + holder.getLocation().getX() + separator + holder.getLocation().getY() + separator + holder.getLocation().getZ()) : "Unknown";
                                default:
                                    return "InvalidAttribute";
                            }
                        }
                        return "TargetIsNotHumanEntity";
                    case "openInventoryTitle":
                    case "openInvTitle":
                        if (target instanceof HumanEntity) {
                            return target.getOpenInventory().getTitle();
                        }
                        return "TargetIsNotHumanEntity";
                    case "isValid":
                        return target.isValid();
                    case "hasPath":
                        if (target instanceof Mob) {
                        	return target.getPathfinder().hasPath();
                        } else {
                            return getTaskForUUID(target.getUniqueId().toString()) !== "NoPath";
                        }
                    case "path":
                        switch (attribute) {
                            case "lastPoint":
                                if (target instanceof Mob) {
                                    var path = target.getPathfinder().getCurrentPath();
                                    if (path && path.getFinalPoint()) {
                                        var p = path.getFinalPoint();
                                        return p.getWorld().getName() + separator + p.getX() + separator + p.getY() + separator + p.getZ() + separator + p.getPitch() + separator + p.getYaw();
                                    } else return "NoPath";
                                } else {
                                    return getTaskForUUID(target.getUniqueId().toString(), true);
                                }
                                break;
                            case "allPoints":
                                if (target instanceof Mob) {
                                    var path = target.getPathfinder().getCurrentPath();
                                    if (path && path.getPoints()) {
                                        var points = Java.from(path.getPoints().toArray());
                                        return points.map(function (p) { return p.getWorld().getName() + ";" + p.getX() + ";" + p.getY() + ";" + p.getZ() + ";" + p.getPitch() + ";" + p.getYaw(); }).join(separator);
                                    } else return "NoPath";
                                } else {
                                    return getTaskForUUID(target.getUniqueId().toString(), false);
                                }
                                break;
                            default:
                                return "InvalidAttribute";
                        }
                    case "canSee":
                        if (target instanceof Player) {
                            if (!targetEntity) return "InvalidTargetEntity";
                            try {
                        		return target.canSee(targetEntity);
                            } catch (e) { return false; }
                        }
                        return "TargetIsNotPlayer";
                    case "isInvisible":
                        if (target instanceof LivingEntity) {
                            return target.isInvisible();
                        }
                        return "TargetIsNotLivingEntity";
                    case "isInvulnerable":
                    	return target.isInvulnerable();
                    case "expPercent":
                    	if (target instanceof Player) {
                        	return Math.round(target.getExp() * 100);
                        }
                        return "TargetIsNotPlayer";
                    case "targetBlock":
                        if (target instanceof LivingEntity) {
                            var targetBlock = null;
                            var dist = isNaN(distance) ? 50 : distance;
                            try {
                                if (skipBlocks) {
                                    var skip = new java.util.HashSet();
                                    skipBlocks.forEach(function (b) {
                                    	var block = null;
                                        try {
                                       		block = Material.valueOf(b);
                                       	} catch (e) { return; }
                                       	skip.add(block);
                                    });
                                    targetBlock = target.getTargetBlock(skip, dist);
                                } else {
                                    targetBlock = target.getTargetBlockExact(dist, fluids);
                                }
                            } catch (e) {
                                targetBlock = target.getTargetBlockExact(dist, fluids);
                            }
                            
                            if (!targetBlock) return "None";
                            
                            switch (output) {
                                case "type":
                                    targetBlock = targetBlock.getType().toString();
                                    break;
                                case "location":
                                    var loc = targetBlock.getLocation();
                                    targetBlock = loc.getWorld().getName() + separator + loc.getX() + separator + loc.getY() + separator + loc.getZ();
                                    break;
                                case "face":
                                    var data = targetBlock.getBlockData();
                                    targetBlock = data instanceof Directional ? data.getFacing() : data instanceof Rotatable ? data.getRotation() : null;
                                    break;
                                default:
                                    return "InvalidOutput";
                            }
                            
                            return targetBlock || "None";
                        }
                        return "TargetIsNotLivingEntity";
                    case "targetEntity":
                        var targetEntity = null;
                        var dist = isNaN(distance) ? 50.0 : distance;
                        var size = isNaN(raySize) ? 0.5 : raySize;
                        var loc = target.getEyeLocation();
                        var dir = loc.getDirection();
                        
                        try {
                        	targetEntity = loc.getWorld().rayTraceEntities(loc, dir, dist, size, function (e) { return !e.equals(target); }).getHitEntity();
                        } catch (e) { return "None"; }
                        
                        if (!targetEntity) return "None";
                            
                        switch (output) {
                            case "type":
                                targetEntity = targetEntity.getType().toString();
                                break;
                            case "location":
                                var loc = targetEntity.getLocation();
                                targetEntity = loc.getWorld().getName() + separator + loc.getX() + separator + loc.getY() + separator + loc.getZ() + separator + loc.getYaw() + separator + loc.getPitch();
                                break;
                            case "face":
                                targetEntity = targetEntity.getFacing();
                                break;
                            case "uuid":
                                targetEntity = targetEntity.getUniqueId().toString();
                                break;
                            case "enum":
                                targetEntity = targetEntity.toString();
                                break;
                            case "name":
                                targetEntity = targetEntity.getName ? targetEntity.getName() : "Unknown";
                                break;
                            default:
                                return "InvalidOutput";
                        }
                            
                        return targetEntity || "None";
                    case "face":
                    	return target.getFacing();
                    case "velocity":
                        var vel = target.getVelocity();
                        switch (attribute) {
                            case "x":
                                vel = vel.getX();
                                break;
                            case "y":
                                vel = vel.getY();
                                break;
                            case "z":
                                vel = vel.getZ();
                                break;
                            case "xz":
                                vel.setY(0);
                                vel = vel.length();
                                break;
                            case "general":
                                vel = vel.length();
                                break;
                            default:
                                return "InvalidAttribute";
                        }
                        
                    	return vel;
                    case "color":
                        if (target instanceof Colorable) {
                            return target.getColor();
                        }
                        return "TargetIsNotColorable";
                    case "pose":
                    	return target.getPose();
                    case "spawnReason":
                    	return target.getEntitySpawnReason ? target.getEntitySpawnReason() : "OnlyPaperAndAbove";
                    case "workBlock":
                    	if (target instanceof Villager) {
                            var nmsVil = target.getHandle();
                            if (!nmsVil.getBrain) return "OnlyPaper1.20.5+";
                            
                            var MemoryModuleType = Java.type("net.minecraft.world.entity.ai.memory.MemoryModuleType");
                            var jobSite = nmsVil.getBrain().getMemory(MemoryModuleType.JOB_SITE);
                            
                            if (jobSite.isPresent()) {
                                var global = jobSite.get();
                                var pos = global.pos();
                                var dim = global.dimension();

                                var server = nmsVil.getServer();
                                var level = server.getLevel(dim);

                                var block = level.getWorld().getBlockAt(pos.getX(), pos.getY(), pos.getZ());
                                
                                if (attribute && attribute.startsWith("loc:")) {
                                    var parts = attribute.split(":");
                                    attribute = parts[0];
                                    var coords = parts[1].split(",");
                                }
                                switch (attribute) {
                                    case "type":
                                        return block.getType().name();
                                    case "loc":
                                        var location = block.getLocation();
                                        var output = [];
                                        if (!coords) coords = ["world", "x", "y", "z"];
										
                                        coords.forEach(function(coord) {
                                            switch (coord) {
                                                case "world":
                                                    output.push(location.getWorld().getName());
                                                    break;
                                                case "x":
                                                    output.push(location.getX());
                                                    break;
                                                case "y":
                                                    output.push(location.getY());
                                                    break;
                                                case "z":
                                                    output.push(location.getZ());
                                                    break;
                                                default:
                                                    return "InvalidCoord";
                                            }
                                        });

                                        return output.join(separator);
                                    default:
                                        return "InvalidAttribute";
                                }
                            }
                            
                            return "None";
                        }
                        return "TargetIsNotVillager";
                    case "realUUID":
                        if (target instanceof Player || target instanceof OfflinePlayer) {
                            var spAttribute = attribute ? attribute.split("=") : [];
                            if (spAttribute.length > 1) {
                                attribute = spAttribute[0];
                                var returnKey = spAttribute[1];
                            }
                            switch (attribute) {
                                case "ASYNC":
                                    if (returnKey == null) return "MissingKey";

                                    if (realUUIDResultsCache.containsKey(returnKey)) {
                                        return realUUIDResultsCache.get(returnKey);
                                    }

                                    realUUIDResultsCache.put(returnKey, "Loading...");

                                    var playerName = target.getName();
                                    Bukkit.getScheduler().runTaskAsynchronously(plugin, new (Java.extend(Runnable, {
                                        run: function () {
                                            try {
                                                var uuid = fetchMojangUUIDAsync(playerName)
                                                    .get(2500, TimeUnit.MILLISECONDS);
                                                var resultString = uuid ? uuid.toString() : "";
                                                realUUIDResultsCache.put(returnKey, resultString);
                                            } catch (e) {
                                                realUUIDResultsCache.put(returnKey, "Error: " + e.message);
                                            }
                                        }
                                    }))());

                                    return "Loading...";
                                case "SYNC":
                                    try {
                                        var playerName = target.getName();
                                        var uuid = fetchMojangUUIDAsync(playerName)
                                            .get(1000, TimeUnit.MILLISECONDS);
                                        return uuid ? uuid.toString() : "";
                                    } catch (e) {
                                        return "";
                                    }
                                default:
                                    return "InvalidAttribute";
                            }
                        }
                        return "TargetIsNotPlayerOrOfflinePlayer";
                    default:
                        return "InvalidAction";
                }
            }
            
            // ===================== GET BLOCK LIGHT ===================== //
            
            if (identifier.startsWith("block_")) {
				var args = identifier.substring("block_".length).split("_");
                
                if (args.length < 6) return "InvalidArguments";
                
                var action = args[0].trim();
                var separator = args[1];
                var x = parseInt(args[2]);
                var y = parseInt(args[3]);
                var z = parseInt(args[4]);
                var worldName = args.slice(5).join("_");
				
                var world = null;
                try {
                    world = Bukkit.getWorld(worldName);
                } catch (e) {
                    return "InvalidWorld";
                }
                if (!world) return "InvalidWorld";
                
                var location = null;
                try {
                    location = new Location(world, x, y, z);
                } catch (e) {
                    return "LocationNotFound";
                }
                if (!location) return "LocationNotFound";
                
                var block = null;
                try {
                    block = location.getBlock();
                } catch (e) {
                    return "BlockNotFound";
                }
                if (!block) return "BlockNotFound";
                
                if (action.startsWith("light:") || action.startsWith("color:") || action.startsWith("inventoryOwner:") || action.startsWith("invOwner:")) {
                    var parts = action.split(":");
                    action = parts[0];
                    var attribute = parts[1];
                }
                
                var blockState = block.getState();
                switch (action) {
					case "light":
                        switch (attribute) {
                            case "fromBlocks":
                            	return block.getLightFromBlocks();
                            case "fromSky":
                                return block.getLightFromSky();
                            case "default":
                                return block.getLightLevel();
                            default:
                                return "InvalidState";
                        }
                    case "inventory":
                    case "inv":
                		if (blockState instanceof InventoryHolder) {
                        	return blockState.getInventory().getType().toString();
                        }
                        return "BlockIsNotInventoryHolder";
                    case "inventorySize":
                    case "invSize":
                		if (blockState instanceof InventoryHolder) {
                        	return blockState.getInventory().getSize();
                        }
                        return "BlockIsNotInventoryHolder";
                    case "inventoryOwner":
                    case "invOwner":
                		if (blockState instanceof InventoryHolder) {
                        	var holder = blockState.getInventory().getHolder();
                            if (!holder) return "None";
                            switch (attribute) {
                                case "uuid":
                                    return holder.getUniqueId ? holder.getUniqueId().toString() : "Unknown";
                                case "type":
                                    return holder.getType().name();
                                case "enum":
                                    return holder.toString();
                                case "name":
                                    return holder.getName ? holder.getName() : "Unknown";
                                case "coords":
                                    return holder ? (holder.getWorld().getName() + separator + holder.getLocation().getX() + separator + holder.getLocation().getY() + separator + holder.getLocation().getZ()) : "Unknown";
                                default:
                                    return "InvalidAttribute";
                            }
                        }
                        return "BlockIsNotInventoryHolder";
                    case "face":
                        var data = blockState.getBlockData();
						if (data instanceof Directional) {
                        	return data.getFacing();
                        }
                        if (data instanceof Rotatable) {
                        	return data.getRotation();
                        }
                        return "BlockIsNotDirectionalOrRotatable";
                    case "color":
                        if (blockState instanceof Colorable) {
                            var side = null;
                            try {
                                side = org.bukkit.block.sign.Side.valueOf(attribute.trim().toUpperCase());
                            } catch (e) {}
                            
                            if (blockState instanceof org.bukkit.block.Sign && side) return blockState.getSide(side).getColor();
                            else return blockState.getColor();
                        }
                        return "BlockIsNotColorable";
                    default:
                        return "InvalidAction";
                }
            }
            
            // ===================== WORKING WITH MYSQL ===================== //
            
            if (identifier.startsWith("mysql_")) {
				var args = identifier.substring("mysql_".length).split("_");
                
                if (args.length < 1) return "InvalidArguments";
                
                function setAutoParam(stmt, index, val) {
                    try {
                        if (val.toLowerCase() === "null") {
                            stmt.setNull(index, Types.NULL);
                            return;
                        }
                        if (val === "true" || val === "false") {
                            stmt.setBoolean(index, val === "true");
                            return;
                        }
                        if (/^\d{13}$/.test(val)) {
                            stmt.setTimestamp(index, new Timestamp(java.lang.Long.parseLong(val)));
                            return;
                        }
                        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                            stmt.setDate(index, Date.valueOf(val));
                            return;
                        }
                        if (/^-?\d+$/.test(val)) {
                            var longVal = java.lang.Long.parseLong(val);
                            if (longVal >= -2147483648 && longVal <= 2147483647) {
                                stmt.setInt(index, parseInt(val));
                            } else {
                                stmt.setLong(index, longVal);
                            }
                            return;
                        }
                        if (/^-?\d+\.\d+$/.test(val)) {
                            stmt.setDouble(index, parseFloat(val));
                            return;
                        }
                        stmt.setString(index, val);
                    } catch (e) {
                        stmt.setString(index, val);
                    }
                }
                
                var returnMethod = args[0].split(":")[0].trim();
                switch (returnMethod) {
                    case "SYNC":
                        if (args.length < 3) return "InvalidArguments";
                        
                        var jdbcUrl = args[1].trim().replaceAll("ᵕ", "_").replaceAll("╵", "%");
            			var query = args[2].trim().replaceAll("ᵕ", "_").replaceAll("╵", "%");
                        
                        if (query.toLowerCase().startsWith("insert") || query.toLowerCase().startsWith("update")) {
                            return "OnlySelectionIsAllowed";
                        }
                        
                        var params = args.length >= 4 ? args[3].trim().replaceAll("ᵕ", "_").replaceAll("╵", "%").split(",") : [];
                        
                        try {
                            try {
                                var conn = DriverManager.getConnection(jdbcUrl);
                            } catch (e) {
                                return "InvalidJDBCLink";
                            }

                            try {
                                var stmt = conn.prepareStatement(query);
                            } catch (e) {
                                return "InvalidQuery";
                            }

                            for (var i = 0; i < params.length; i++) {
                                setAutoParam(stmt, i + 1, params[i].trim());
                            }

                            var rs = stmt.executeQuery();
                            var meta = rs.getMetaData();
                            var columns = meta.getColumnCount();

                            var results = [];

                            while (rs.next()) {
                                var row = [];
                                for (var i = 1; i <= columns; i++) {
                                    var val = rs.getString(i);
                                    row.push(val !== null ? val : "null");
                                }
                                results.push(row.join(","));
                            }

                            rs.close();
                            stmt.close();
                            conn.close();

                            return results.length > 0 ? results.join(";") : "";
                        } catch (e) {
                            e.printStackTrace();
                            if (e instanceof SQLException) {
                                return "SQLException: " + e.message;
                            } else {
                                return "Error: " + e.message;
                            }
                        }
                        break;
                    case "ASYNC":
                 		var returnKey = args[0].split(":")[1];
                        if (args.length < 2) return mysqlResultsCache.containsKey(returnKey) ? mysqlResultsCache.get(returnKey) : "";
                        if (args.length < 3) return "InvalidArguments";
                        
                        var jdbcUrl = args[1].trim().replaceAll("ᵕ", "_").replaceAll("╵", "%");
            			var query = args[2].trim().replaceAll("ᵕ", "_").replaceAll("╵", "%");
                        
                        if (query.toLowerCase().startsWith("insert") || query.toLowerCase().startsWith("update")) {
                            return "OnlySelectionIsAllowed";
                        }
                        
                        var params = args.length >= 4 ? args[3].trim().replaceAll("ᵕ", "_").replaceAll("╵", "%").split(",") : [];
                        
                        mysqlResultsCache.put(returnKey, "Loading...");
                        Bukkit.getScheduler().runTaskAsynchronously(plugin, new (Java.extend(Runnable, {
                            run: function() {
                                try {
                                    try {
                                        var conn = DriverManager.getConnection(jdbcUrl);
                                    } catch (e) {
                                        mysqlResultsCache.put(returnKey, "InvalidJDBCLink");
                                        return;
                                    }

                                    try {
                                        var stmt = conn.prepareStatement(query);
                                    } catch (e) {
                                        mysqlResultsCache.put(returnKey, "InvalidQuery");
                                        return;
                                    }

                                    for (var i = 0; i < params.length; i++) {
                                        setAutoParam(stmt, i + 1, params[i].trim());
                                    }

                                    var rs = stmt.executeQuery();
                                    var meta = rs.getMetaData();
                                    var columns = meta.getColumnCount();

                                    var results = [];

                                    while (rs.next()) {
                                        var row = [];
                                        for (var i = 1; i <= columns; i++) {
                                            var val = rs.getString(i);
                                            row.push(val !== null ? val : "null");
                                        }
                                        results.push(row.join(","));
                                    }

                                    rs.close();
                                    stmt.close();
                                    conn.close();

                                    var resultString = results.length > 0 ? results.join(";") : "";
                                    mysqlResultsCache.put(returnKey, resultString);
                                } catch (e) {
                                    e.printStackTrace();
                                    if (e instanceof SQLException) {
                                        return "SQLException: " + e.message;
                                    } else {
                                        return "Error: " + e.message;
                                    }
                                }
                            }
                        }))());
                        break;
                    default:
                        return "InvaildMethod";
                }
            }
            
            // ===================== GET STRUCTURE BY LOCATION ===================== //
            
            if (identifier.startsWith("structure_")) {
				var args = identifier.substring("structure_".length).split("_");
                
                if (args.length < 1) return "InvalidArguments";
                
                var actionRaw = args[0].trim().split(":");
                var action = actionRaw[0];
                var unsafe = false;
                var unsafeSize = 10;
                if (actionRaw.length > 1) unsafe = actionRaw[1] === "unsafe";
                if (actionRaw.length > 2 && !isNaN(actionRaw[2])) unsafeSize = parseInt(actionRaw[2]);
                
                switch (action) {
					case "get":
                        args = args.slice(0, 1).concat(args.slice(1).join("_"));
                        var location = args[1].trim().split(",");
                        var x = parseFloat(location[0]);
                        var y = parseFloat(location[1]);
                        var z = parseFloat(location[2]);
                        var worldName = location[3];

                        var world = null;
                        try {
                            world = Bukkit.getWorld(worldName);
                        } catch (e) {
                            return "InvalidWorld";
                        }
                        if (!world) return "InvalidWorld";

                        var location = null;
                        try {
                            location = new Location(world, x, y, z);
                        } catch (e) {
                            return "LocationNotFound";
                        }
                        if (!location) return "LocationNotFound";
                        
                        if (location.getChunk().getStructures) {
                            var structures = location.getChunk().getStructures();
                            if (structures != null && !structures.isEmpty()) {
                                var iter = structures.iterator();
                                while (iter.hasNext()) {
                                    var s = iter.next();
                                    if (unsafe) {
                                        for (var i = x - unsafeSize; i <= x + unsafeSize; i++) {
                                            for (var j = y - unsafeSize; j <= y + unsafeSize; j++) {
                                                for (var k = z - unsafeSize; k <= z + unsafeSize; k++) {
                                                    if (s.getBoundingBox().contains(i, j, k)) {
                                                        return s.getStructure().getKey().getKey().toUpperCase();
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        if (s.getBoundingBox().contains(x, y, z)) {
                                            return s.getStructure().getKey().getKey().toUpperCase();
                                        }
                                    }
                                }
                            }
                        } else return "Only1.20.4+";
                        break;
                    case "check":
                        args = args.slice(0, 2).concat(args.slice(2).join("_"));
                		if (args.length < 2) return "InvalidArguments";
                        var type = args[1].trim().replaceAll("-", "_").toUpperCase();
                        var location = args[2].trim().split(",");
                        var x = parseFloat(location[0]);
                        var y = parseFloat(location[1]);
                        var z = parseFloat(location[2]);
                        var worldName = location[3];
                        
                        var world = null;
                        try {
                            world = Bukkit.getWorld(worldName);
                        } catch (e) {
                            return "InvalidWorld";
                        }
                        if (!world) return "InvalidWorld";

                        var location = null;
                        try {
                            location = new Location(world, x, y, z);
                        } catch (e) {
                            return "LocationNotFound";
                        }
                        if (!location) return "LocationNotFound";
                        
                        if (location.getChunk().getStructures) {
                            var structures = location.getChunk().getStructures();
                            if (structures != null && !structures.isEmpty()) {
                                var iter = structures.iterator();
                                while (iter.hasNext()) {
                                    var s = iter.next();
                                    if (unsafe) {
                                        for (var i = x - unsafeSize; i <= x + unsafeSize; i++) {
                                            for (var j = y - unsafeSize; j <= y + unsafeSize; j++) {
                                                for (var k = z - unsafeSize; k <= z + unsafeSize; k++) {
                                                    if (s.getBoundingBox().contains(i, j, k) && s.getStructure().getKey().getKey().toString().toUpperCase() === type) {
                                                        return true;
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        if (s.getBoundingBox().contains(x, y, z) && s.getStructure().getKey().getKey().toString().toUpperCase() === type) {
                                            return true;
                                        }
                                    }
                                }
                                return false;
                            }
                        } else return "Only1.20.4+";
                        break;
                    default:
                        return "InvalidAction";
                }
                
                return "None";
            }
            
            // ===================== REPEATING PLACEHOLDER ===================== //
            
            if (identifier.startsWith("repeat_")) {
				var args = identifier.substring("repeat_".length).split("_");
                
                if (args.length < 2) return "InvalidArguments";
                
                var text = args[0].replaceAll("ᵕ", "_");
                if (isNaN(args[1])) return "AmountIsNotANumber";
                var amount = parseInt(args[1]);
				
                return text.repeat(amount);
            }
            
            // ===================== PLAYER LISTS PLACEHOLDER ===================== //
            
            if (identifier.startsWith("list_")) {
                var withoutPrefix = identifier.substring("list_".length);

                var mode = "SYNC";
                var returnKey = null;
                var limit = -1;

                if (withoutPrefix.startsWith("ASYNC:")) {
                    var split = withoutPrefix.split("_");
                    var firstArg = split[0];
                    returnKey = firstArg.split(":")[1];

                    if (split.length === 1) {
                        return listResultsCache.containsKey(returnKey) ? listResultsCache.get(returnKey) : "";
                    }

                    mode = "ASYNC";
                    withoutPrefix = withoutPrefix.substring(firstArg.length + 1);

                    var nextUnderscore = withoutPrefix.indexOf("_");
                    if (nextUnderscore !== -1) {
                        var maybeLimit = withoutPrefix.substring(0, nextUnderscore);
                        if (/^\d+$/.test(maybeLimit)) {
                            limit = parseInt(maybeLimit);
                            withoutPrefix = withoutPrefix.substring(maybeLimit.length + 1);
                        }
                    }
                } else if (withoutPrefix.startsWith("SYNC_")) {
                    withoutPrefix = withoutPrefix.substring("SYNC_".length);

                    var nextUnderscore = withoutPrefix.indexOf("_");
                    if (nextUnderscore !== -1) {
                        var maybeLimit = withoutPrefix.substring(0, nextUnderscore);
                        if (/^\d+$/.test(maybeLimit)) {
                            limit = parseInt(maybeLimit);
                            withoutPrefix = withoutPrefix.substring(maybeLimit.length + 1);
                        }
                    }
                } else {
                    var nextUnderscore = withoutPrefix.indexOf("_");
                    if (nextUnderscore !== -1) {
                        var maybeLimit = withoutPrefix.substring(0, nextUnderscore);
                        if (/^\d+$/.test(maybeLimit)) {
                            limit = parseInt(maybeLimit);
                            withoutPrefix = withoutPrefix.substring(maybeLimit.length + 1);
                        }
                    }
                }

                function processList(withoutPrefix, limit) {
                    var separatorEnd = withoutPrefix.indexOf("_");
                    if (separatorEnd === -1) return "InvalidArguments";
                    var separatorRaw = withoutPrefix.substring(0, separatorEnd);
                    var separator = separatorRaw.replace(/\\n/g, "\n").replace(/\\s/g, " ").replace(/\\t/g, "\t");

                    var afterSeparator = withoutPrefix.substring(separatorEnd + 1);

                    var typeEnd = afterSeparator.indexOf("_");
                    if (typeEnd === -1) return "InvalidArguments";
                    var type = afterSeparator.substring(0, typeEnd).toUpperCase();

                    var afterType = afterSeparator.substring(typeEnd + 1);

                    var sortMatch = afterType.match(/^(AZ|ZA|NONE|SORT:\$.*?@(?:\s+DESC)?)(?:_)/);
                    if (!sortMatch) return "InvalidArguments";

                    var sortRaw = sortMatch[1];
                    var rest = afterType.substring(sortRaw.length + 1);

                    var sortMode = "NONE";
                    var sortPlaceholder = null;
                    var sortDescending = false;

                    if (sortRaw.toUpperCase() === "AZ") {
                        sortMode = "AZ";
                    } else if (sortRaw.toUpperCase() === "ZA") {
                        sortMode = "ZA";
                    } else if (sortRaw.toUpperCase().startsWith("SORT:")) {
                        sortMode = "PLACEHOLDER";

                        var sortExpr = sortRaw.substring(5);
                        var parts = sortExpr.split(/\s+/);

                        sortPlaceholder = parts[0];
                        if (parts.length > 1 && parts[1].toUpperCase() === "DESC") {
                            sortDescending = true;
                        }
                    }

                    function findEndOfFormattedPlaceholderString(input) {
                        var i = 0;
                        var depth = 0;

                        while (i < input.length) {
                            var char = input.charAt(i);
                            var next = input.charAt(i + 1);

                            if (char === "\\" && (next === "$" || next === "@")) {
                                i += 2;
                                continue;
                            }

                            if (char === "$") {
                                depth++;
                                i++;
                                continue;
                            }

                            if (char === "@") {
                                depth--;
                                i++;
                                if (depth <= 0) {
                                    while (input.charAt(i) === "\\" && (input.charAt(i + 1) === "$" || input.charAt(i + 1) === "@")) {
                                        i += 2;
                                    }
                                    if (input.charAt(i) === "_") return i;
                                }
                                continue;
                            }

                            i++;
                        }

                        return -1;
                    }

                    var outputEnd = findEndOfFormattedPlaceholderString(rest);
                    if (outputEnd === -1) {
                        if (rest.endsWith("@")) {
                            outputEnd = rest.length;
                        } else {
                            return "InvalidOutputPlaceholder";
                        }
                    }
                    var outputRaw = rest.substring(0, outputEnd);

                    var rawCondition = "";
                    if (outputEnd < rest.length && rest.charAt(outputEnd) === "_") {
                        rawCondition = rest.substring(outputEnd + 1);
                    }
                    
                    outputRaw = outputRaw.replaceAll("␠", " ");
    				rawCondition = rawCondition.replaceAll("␠", " ").replaceAll("ᵕ", "_");

                    var exprTree = null;
                    if (rawCondition.trim().length > 0) {
                        exprTree = parseExpression(rawCondition);
                        if (!exprTree) return "InvalidExpression";
                    }

                    var result = [];
                    var players = (type === "ONLINE") ? Bukkit.getOnlinePlayers() : [];
                    if (type === "ALL" || type === "OFFLINE") {
                        var offline = Bukkit.getOfflinePlayers();
                        for (var i = 0; i < offline.length; i++) {
                            var p = offline[i];
                            if (p.isOnline()) {
                                if (type === "OFFLINE") continue;
                            }
                            players.push(offline[i]);
                        }
                    }

                    var canEarlyStop = (sortMode === "NONE");

                    for (var i = 0; i < players.length; i++) {
                        if (limit > 0 && canEarlyStop && result.length >= limit) break;

                        var p = players[i];
                        try {
                            if (evaluateExpression(p, exprTree)) {
                                var value = resolveNestedPlaceholders(p, outputRaw);
                                result.push({ value: value, player: p });

                                if (limit > 0 && canEarlyStop && result.length >= limit) break;
                            }
                        } catch (e) {
                            if (type !== "ONLINE") continue;
                        }
                    }

                    if (sortMode === "AZ") {
                        result.sort(function (a, b) { return a.value.localeCompare(b.value) });
                    } else if (sortMode === "ZA") {
                        result.sort(function (a, b) { return b.value.localeCompare(a.value) });
                    } else if (sortMode === "PLACEHOLDER" && sortPlaceholder) {
                        result.forEach(function (e) {
                            e.sortVal = resolveNestedPlaceholders(e.player, sortPlaceholder);
                        });
                        result.sort(function (a, b) {
                            var aVal = a.sortVal;
                            var bVal = b.sortVal;

                            var aNum = parseFloat(aVal);
                            var bNum = parseFloat(bVal);

                            var bothNumbers = !isNaN(aNum) && !isNaN(bNum);

                            if (bothNumbers) {
                                return sortDescending ? bNum - aNum : aNum - bNum;
                            }

                            return sortDescending
                                ? bVal.toString().localeCompare(aVal.toString())
                                : aVal.toString().localeCompare(bVal.toString());
                        });
                    }

                    if (limit > 0 && result.length > limit) {
                        result = result.slice(0, limit);
                    }

                    return result.length > 0 ? result.map(function (e) { return e.value }).join(separator) : "";
                }

                if (mode === "SYNC") {
                    return processList(withoutPrefix, limit);
                }

                if (mode === "ASYNC") {
                    listResultsCache.put(returnKey, "Loading...");
                    var argsForTask = withoutPrefix;
                    var limitForTask = limit;

                    Bukkit.getScheduler().runTaskAsynchronously(plugin, new (Java.extend(Runnable, {
                        run: function () {
                            try {
                                var resultString = processList(argsForTask, limitForTask);
                                listResultsCache.put(returnKey, resultString);
                            } catch (e) {
                                listResultsCache.put(returnKey, "Error: " + e.message);
                            }
                        }
                    }))());

                    return "Loading...";
                }
            }
            
            // ===================== CUSTOM MOON PHASES PLACEHOLDER ===================== //
            
            if (identifier.startsWith("customMoon_")) {
                var args = identifier.substring("customMoon_".length).split("_");
                
                if (args.length < 2) return "InvalidArguments";
                
                var custom = args[0].split(":");
                var customState = custom[0].trim().toLowerCase() === "true";
                var customOutput = custom.length > 1 ? custom[1].split(",") : [];
				var worldName = args.slice(1).join("_");
                
                var world = Bukkit.getWorld(worldName);
                if (!world) return "InvalidWorld";
				
                var curMoonNumber = Math.floor((world.getFullTime() / 24000) % 8);
                if (customState) {
                    var moonsEN = {0: "FULL MOON", 1: "WANING GIBBOUS", 2: "LAST QUARTER", 3: "WANING CRESCENT", 4: "NEW MOON", 5: "WAXING CRESCENT", 6: "FIRST QUARTER", 7: "WAXING GIBBOUS"};
                    var moonsRU = {0: "ПОЛНОЛУНИЕ", 1: "УБЫВАЮЩАЯ ЛУНА", 2: "ПОСЛЕДНЯЯ ЧЕТВЕРТЬ", 3: "СТАРАЯ ЛУНА", 4: "НОВОЛУНИЕ", 5: "РАСТУЩАЯ ЛУНА", 6: "ПЕРВАЯ ЧЕТВЕРТЬ", 7: "МОЛОДАЯ ЛУНА"};
                    var moonsES = {0: "LUNA LLENA", 1: "GIBOSA MENGUANTE", 2: "CUARTO MENGUANTE", 3: "LUNA MENGUANTE", 4: "LUNA NUEVA", 5: "LUNA CRECIENTE", 6: "CUARTO CRECIENTE", 7: "GIBOSA CRECIENTE"};
                    
                    var curMoon = moonsEN[curMoonNumber];
                    customOutput.forEach(function (o) {
                        switch (o) {
                            case "Us":
                                curMoon = curMoon.replaceAll(" ", "_");
                                break;
                            case "Dh":
                                curMoon = curMoon.replaceAll(" ", "-");
                                break;
                            case "Lc":
                            	curMoon = curMoon.toLowerCase();
                                break;
                            case "Uc":
                            	curMoon = curMoon.toUpperCase();
                                break;
                            case "FUc":
                            	curMoon = curMoon.toLowerCase().replace(/([\u00C0-\u024F\u0400-\u04FFA-Za-z])([\u00C0-\u024F\u0400-\u04FFA-Za-z]*)/g, function(_, first, rest) { return first.toUpperCase() + rest; });
                                break;
                            case "ES":
                            	curMoon = moonsES[curMoonNumber];
                                break;
                            case "RU":
                            	curMoon = moonsRU[curMoonNumber];
                                break;
                            case "EN":
                            	curMoon = moonsEN[curMoonNumber];
                                break;
                            default:
                                break;
                    	}
                    });
                    
                    return curMoon;
                } else return curMoonNumber;
            }
            
            // ===================== OFFLINE PLAYER BEDROCK CHECKING ===================== //
            
            if (identifier.startsWith("isBedrock_")) {
                var uuid = identifier.substring("isBedrock_".length).split("_");
                
                if (!uuid) return "InvalidUUID";
                
                try {
                	uuid = UUID.fromString(uuid);
                } catch (e) {
                    return "InvalidUUID";
                }
                
                return uuid.getMostSignificantBits() == 0;
            }
            
            // ===================== GET BLOCKS COUNT IN CHUNK EFFICIENTLY ===================== //
            
            if (identifier.startsWith("countBlocks_")) {
                var args = identifier.substring("countBlocks_".length).split("_");
                
                if (args.length < 2) return "InvalidArguments"
                
                var type = null;
                try {
                    type = Material.valueOf(args[0].trim().toUpperCase().replaceAll("-", "_"));
                } catch (e) {
                    type = null;
                }
                
                if (!type) return "InvalidMaterial";
                
                var targetIdentifier = args.slice(1).join("_").trim();
                var target = null;
                if (targetIdentifier.indexOf(",") !== -1) {
                    var parts = targetIdentifier.split(",");
                    if (parts.length === 4) {
                        var world = Bukkit.getWorld(parts[0]);
                        var x = parseFloat(parts[1]);
                        var y = parseFloat(parts[2]);
                        var z = parseFloat(parts[3]);
                            
                        try {
                        	target = world.getBlockAt(x, y, z);
                        } catch (e) {
                            return "InvalidLocation";
                        }
                    } else {
                        return "InvalidLocation";
                    }
                } else {
                    try {
                        var uuid = UUID.fromString(targetIdentifier);
                        target = getEntitySync(uuid);
                    } catch (e) {
                        target = getPlayerSync(targetIdentifier, false);
                    }
                }
                
                if (!target) return "InvalidTarget";
                
                var nmsWorld = target.getWorld().getHandle();
                if (!nmsWorld.getChunk) return "OnlyPaper1.20.5+";
                
                var chunk = target.getChunk();
                var nmsChunk = nmsWorld.getChunk(chunk.getX(), chunk.getZ());
                
                var CraftMagicNumbers = Java.type("org.bukkit.craftbukkit.util.CraftMagicNumbers");
				var PalettedContainer$CountConsumer = Java.type("net.minecraft.world.level.chunk.PalettedContainer$CountConsumer");
                var block = CraftMagicNumbers.getBlock(type);
                
                var count = 0;
                var sections = nmsChunk.getSections();
                java.util.Arrays.asList(sections).forEach(function (s) {
                    if (s === null || s.hasOnlyAir()) return;
                    var palette = s.getStates();

                    var consumer = new PalettedContainer$CountConsumer({
                        accept: function(state, amount) {
                            if (state !== null && state.getBlock() === block) {
                                count += amount;
                            }
                        }
                    });

                    palette.count(consumer);
                });
                return count;
            }
            
            // ===================== CHECK WHETHER THE INPUT IS NUMBER ===================== //
            
            if (identifier.startsWith("isObject_")) {
                var args = identifier.substring("isObject_".length).split("_");
                
                if (args.length < 2) return "InvalidArguments";
                
                var compare = args[0].trim().toLowerCase();
                var input = args.slice(1).join("_");
                
                switch (compare) {
                    case "n":
                    case "num":
                    case "number":
                    	return !isNaN(input);
                    case "i":
                    case "int":
                    case "integer":
                    	var n = +input;
                        return !isNaN(n) && n % 1 === 0;
                    case "u":
                    case "uuid":
                        try {
                    		var r = UUID.fromString(input);
                            return true;
                        } catch (e) {
                            return false;
                        }
                    case "p":
                    case "player":
                    	return getPlayerSync(input, false) || getPlayerSync(input, true).hasPlayedBefore();
                        return r ? true : false;
                    default:
                        return "InvalidCompare";
                }
            }
            
            // ===================== REPLACE INPUT THROUGH REGEX ===================== //
            
            if (identifier.startsWith("replaceRegEx_")) {
                var args = identifier.substring("replaceRegEx_".length).split("_");
                
                if (args.length < 3) return "InvalidArguments";
                
                var pattern = normalizeString(args[0]);
                var replace = normalizeString(args[1]);
                var input = normalizeString(args.slice(2).join("_"));
                
                try {
                    return input.replace(new RegExp(pattern, "g"), replace);
                } catch (e) {
                    return "InvalidRegex";
                }
            }
            
            // ===================== REPLACE INPUT THROUGH MULTI REPLACEMENT ===================== //
            
            if (identifier.startsWith("replaceMulti_")) {
                var args = identifier.substring("replaceMulti_".length).split("_");
                
                if (args.length < 2) return "InvalidArguments";
                
                var input = normalizeString(args.slice(1).join("_"));
				
                var pattern = normalizeString(args[0]).replace(/\\:/g, "\uE004").replace(/\\=/g, "\uE005").split(":");
                pattern.forEach(function (p) {
                    var p = p.replace(/\uE004/g, ":");
                	var from = p.substring(0, p.indexOf("=")).replace(/\uE005/g, "=");
                	var to = p.substring(p.indexOf("=")+1).replace(/\uE005/g, "=");
                    
                    input = input.split(from).join(to);
                });
                
                return input;
            }
            
            // ===================== CHECK THE DISTANCE BETWEEN TWO POINTS ===================== //
            
            if (identifier.startsWith("distance_")) {
                var args = identifier.substring("distance_".length).split("_");
                
                if (args.length < 2) return "InvalidArguments"
                
                var point1Identifier = args[0].replaceAll("ᵕ", "_");
                var point2Identifier = args[1].replaceAll("ᵕ", "_");
                
                var point1 = null;
                if (point1Identifier.indexOf(",") !== -1) {
                    var parts = point1Identifier.split(",");
                    if (parts.length === 4) {
                        var world = Bukkit.getWorld(parts[0]);
                        var x = parseFloat(parts[1]);
                        var y = parseFloat(parts[2]);
                        var z = parseFloat(parts[3]);
                            
                        try {
                        	point1 = world.getBlockAt(x, y, z);
                        } catch (e) {
                            return "InvalidLocation";
                        }
                    } else {
                        return "InvalidLocation";
                    }
                } else {
                    try {
                        var uuid = UUID.fromString(point1Identifier);
                        point1 = getEntitySync(uuid);
                    } catch (e) {
                        point1 = getPlayerSync(point1Identifier, false);
                    }
                }
                
                if (!point1) return "InvalidPoint1";
                
                var point2 = null;
                if (point2Identifier.indexOf(",") !== -1) {
                    var parts = point2Identifier.split(",");
                    if (parts.length === 4) {
                        var world = Bukkit.getWorld(parts[0]);
                        var x = parseFloat(parts[1]);
                        var y = parseFloat(parts[2]);
                        var z = parseFloat(parts[3]);
                            
                        try {
                        	point2 = world.getBlockAt(x, y, z);
                        } catch (e) {
                            return "InvalidLocation";
                        }
                    } else {
                        return "InvalidLocation";
                    }
                } else {
                    try {
                        var uuid = UUID.fromString(point2Identifier);
                        point2 = getEntitySync(uuid);
                    } catch (e) {
                        point2 = getPlayerSync(point2Identifier, false);
                    }
                }
                
                if (!point2) return "InvalidPoint2";
                
                try {
                	return point1.getLocation().distance(point2.getLocation());
                } catch (e) {
                    return "DifferentWorlds";
                }
            }
            
            return null;
        }
    });

    var registerPlaceholderExpansion = function() {
        var expansion = new CEPlaceholders();
        PlaceholderAPI.registerExpansion(expansion);
    };

    registerPlaceholderExpansion();
}
