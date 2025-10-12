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
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var HashMap = Java.type("java.util.HashMap");
var ArrayList = Java.type("java.util.ArrayList");
var Collectors = Java.type("java.util.stream.Collectors");
var console = Bukkit.getConsoleSender();

var cycles = new HashMap();
var cyclesUpdate = new HashMap();
var cyclesLastOp = new HashMap();

function CEmanageCycle() {
    var ManageCycleAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            var action = args.length > 0 ? args[0].trim().toLowerCase() : null;
            if (!action || ((action === "run" && args.length < 8) || (action === "update" && args.length < 3) || (action === "break" && args.length < 2))) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Invalid format! Correct format: manage_cycle: <action (update, run or break)>;<cycle_name>;(only in case of update action) <changes (for example, ABI(the same as ADD-BY-INDEX):<index>:<value>)>;(only in case of run action) <from_index>;(only in case of run action) <to_index>;(only in case of run action) <step>;(only in case of run action) <array_separator (separator symbol in the array)>;(only in case of run action) <array>;(only in case of run action) <call_event (call event name to call)>;(optional, only in case of run action) <player_name (to call the event for player)>");
                return;
            }
            
            var cycleName = args[1];
            
            switch (action) {
                case "update":
                    var changes = args[2].split(":");
                    
                    var array = cycles.containsKey(cycleName) ? cycles.get(cycleName) : null;
                    
                    if (!array) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Array does not exist by this name.");
						return;
                    }
                    
                    var action = changes[0].trim().toUpperCase();
                    
                    switch (action) {
                        case "ADD-BY-INDEX":
                        case "ABI":
                    		if (changes.length < 3) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Not enough arguments for change. Got " + changes.length + ", expected 3.");
                        		return;
                            }
                            var index = changes[1] === "~" ? array.size() : parseInt(changes[1]);
                            var value = changes[2];
                            array.add(index, value);
                            cyclesLastOp.put(cycleName, "ABI:" + index);
                            break;
                        case "SET-BY-INDEX":
                        case "SBI":
                            if (changes.length < 3) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Not enough arguments for change. Got " + changes.length + ", expected 3.");
                        		return;
                            }
                            var index = changes[1] === "~" ? array.size() - 1 : parseInt(changes[1]);
                            var value = changes[2];
                            array.set(index, value);
                            break;
                        case "SET-BY-VALUE":
                        case "SBV":
                            if (changes.length < 3) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Not enough arguments for change. Got " + changes.length + ", expected 3.");
                        		return;
                            }
                            var oldValue = changes[1];
                            var newValue = changes[2];
                            for (var i = 0; i < array.size(); i++) {
                                if (array.get(i) === oldValue) array.set(i, newValue);
                            }
                            break;
                        case "SET-RANGE":
                        case "SR":
                            if (changes.length < 4) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Not enough arguments for change. Got " + changes.length + ", expected 4.");
                        		return;
                            }
                            var startIndex = changes[1] === "~" ? array.size() - 1 : parseInt(changes[1]);
                            var endIndex = changes[2] === "~" ? array.size() - 1 : parseInt(changes[2]);
                            var value = changes[3];
                            startIndex = Math.max(0, Math.min(startIndex, array.size() - 1));
                            endIndex = Math.max(0, Math.min(endIndex, array.size() - 1));
                            if (startIndex > endIndex) { var t = startIndex; startIndex = endIndex; endIndex = t; }
                            for (var i = startIndex; i <= endIndex; i++) array.set(i, value);
                            break;
                        case "REMOVE-BY-INDEX":
                        case "RBI":
                            if (changes.length < 2) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Not enough arguments for change. Got " + changes.length + ", expected 2.");
                        		return;
                            }
                            var index = changes[1] === "~" ? array.size() - 1 : parseInt(changes[1]);
                            array.remove(index);
                            cyclesLastOp.put(cycleName, "RBI:" + index);
                            break;
                        default:
                            Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Invalid action.");
                        	return;
                    }
                    
                    if (cycles.containsKey(cycleName)) {
                        cycles.put(cycleName, array);
                        cyclesUpdate.put(cycleName, true);
                    }
                    break;
                case "run":
                    var i1 = args[2].trim().toLowerCase() === "last" ? "last" : parseInt(args[2]);
                    var i2 = args[3].trim().toLowerCase() === "last" ? "last" : parseInt(args[3]);
                    var step = parseInt(args[4]);

                    if ((isNaN(i1) && i1 !== "last") || (isNaN(i2) && i2 !== "last") || isNaN(step)) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Indexes and step should be a numbers!");
                        return;
                    }

                    if (step === 0) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Step can not equal to zero!");
                        return;
                    }

                    var separator = args[5];
                    
                    if (separator === ";") {
                    	Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Separator can not be ';'!");
                        return;
                    }
                    
                    var array = new ArrayList(args[6].split(separator));

                    if (i1 === "last") i1 = array.size() - 1;
                    if (i2 === "last") i2 = array.size() - 1;

                    if (i1 < 0 || i2 < 0) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Indexes should be greater or equal to zero!");
                        return;
                    }

                    if (i1 > i2 && step > 0) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Start index is greater than end index, so step should be negative!");
                        return;
                    }

                    if (i1 < i2 && step < 0) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Start index is smaller than end index, so step should be positive!");
                        return;
                    }

                    var call = args[7].trim();
                    player = args.length > 8 ? args[8].trim() : null;

                    cycles.put(cycleName, array);
                    var outputArray = array.stream().map(String).collect(Collectors.joining(separator));
                    
                    var forward = step > 0;
                    var started = false;
                    for (var i = i1; (forward ? (i <= i2) : (i >= i2)); i += step) {

                        if (cyclesUpdate.get(cycleName) === true) {
                            array = cycles.get(cycleName);
                            cyclesUpdate.put(cycleName, false);
                            if (!array) break;

                            outputArray = array.stream().map(String).collect(Collectors.joining(separator));

                            var info = cyclesLastOp.get(cycleName);
                            if (info) {
                                var parts = info.split(":");
                                var op = parts[0];
                                var idx = parseInt(parts[1]);

                                if (op === "RBI") {
                                    if (forward) {
                                        if (idx < i)  i -= 1;
                                        if (idx <= i2) i2 -= 1;
                                    } else {
                                        if (idx > i)  i += 1;
                                    }
                                } else if (op === "ABI") {
                                    if (forward) {
                                        if (idx < i)  i += 1;
                                        if (idx <= i2) i2 += 1;
                                    } else {
                                        if (idx > i)  i -= 1;
                                    }
                                }

                                cyclesLastOp.remove(cycleName);
                            }

                            if (array.size() === 0) break;

                            if (i < 0) i = 0;
                            if (i >= array.size()) i = (forward) ? array.size() - 1 : 0;

                            if (i2 < 0) i2 = 0;
                            if (i2 >= array.size()) i2 = array.size() - 1;

                            if (forward ? (i > i2) : (i < i2)) break;
                        }

                        if (i < 0 || i >= array.size()) break;

                        var val = array.get(i);
                        if (val == null) break;

                        var atBoundary   = (i === i2);
                        var next         = i + step;
                        var willOvershoot = forward ? (next > i2) : (next < i2);

                        var isEndNormal = atBoundary;

                        Bukkit.dispatchCommand(
                            console,
                            "ce call " + call
                            + " %i%=" + i
                            + ";%v%=" + val
                            + ";%s%=" + step
                            + ";%c%=" + cycleName
                            + ";%a%=" + outputArray
                            + ";%l%=" + array.size()
                            + ";%f%=" + (forward ? "+" : "-")
                            + ";%end%=" + (isEndNormal ? "true" : "false")
                            + ";%start%=" + (!started)
                            + ";%o%=false"
                            + (player ? (" player:" + player) : "")
                            + " silent:true"
                        );

                        if (!started) started = true;

                        var notAtBoundary = forward ? (i < i2) : (i > i2);
                        if (willOvershoot && notAtBoundary) {
                            Bukkit.dispatchCommand(
                                console,
                                "ce call " + call
                                + " %i%=" + i
                                + ";%v%=" + val
                                + ";%s%=" + step
                                + ";%c%=" + cycleName
                                + ";%a%=" + outputArray
                                + ";%l%=" + array.size()
                                + ";%f%=" + (forward ? "+" : "-")
                                + ";%end%=true"
                                + ";%start%=" + (!started ? "true" : "false")
                                + ";%o%=true"
                                + (player ? (" player:" + player) : "")
                                + " silent:true"
                            );
                            break;
                        }
                    }
                    break;
                case "break":
                    if (cycles.containsKey(cycleName)) {
                        cycles.put(cycleName, null);
                        cyclesUpdate.put(cycleName, true);
                    }
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Invalid action.");
                	return;
            }
        }
    });

    var manageCycleInstance = new ManageCycleAction("manage_cycle");
    
    return manageCycleInstance;
}

CEmanageCycle();