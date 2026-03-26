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
var Location = Java.type("org.bukkit.Location");

function CEplayerBreakBlock() {
    var PlayerBreakBlockAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 7) {
                Bukkit.getLogger().warning("[CEActions] PLAYER_BREAK_BLOCK ACTION: Invalid format! CORRECT FORMAT: player_break_block: <player>;<world>;<x_center>;<y_center>;<z_center>;<range>;<depth>;(optional) <relative_coords (in format like x1 y1 z1, x2 y2 z2 etc)>;(optional) <byFeet (true|false)>");
                return;
            }

            var targetPlayerName = args[0];
            var worldName = args[1];
            var x = parseInt(args[2]);
            var y = parseInt(args[3]);
            var z = parseInt(args[4]);
            var range = parseInt(args[5]);
            var depth = parseInt(args[6]);
            var relativeCoords = args.length > 7 && args[7] !== "" ? args[7].split(",").map(function(coord) {
                return coord.trim().split(" ").map(Number);
            }) : null;
            var byFeet = args.length > 8 ? args[8].trim().toLowerCase() === "true" : false;

            var targetPlayer = Bukkit.getPlayer(targetPlayerName);
            if (targetPlayer == null) {
                Bukkit.getLogger().warning("[CEActions] PLAYER_BREAK_BLOCK ACTION: Player not found: " + targetPlayerName);
                return;
            }

            var world = Bukkit.getWorld(worldName);
            if (world == null) {
                Bukkit.getLogger().warning("[CEActions] PLAYER_BREAK_BLOCK ACTION: World not found: " + worldName);
                return;
            }

            var playerFeetY = Math.floor(targetPlayer.getLocation().getY());
            var direction = targetPlayer.getLocation().getDirection();
            var yaw = Math.round(targetPlayer.getLocation().getYaw() / 90) * 90;
            var pitch = Math.round(targetPlayer.getLocation().getPitch());

            var isLookingDown = pitch >= 45;

            function rotateCoords(offset) {
                var ox = offset[0], oy = offset[1], oz = offset[2];
                var newX = ox, newY = oy, newZ = oz;

                if (pitch <= -45) {
                    newX = ox;
                    newY = oz;
                    newZ = -oy;
                } else if (pitch >= 45) {
                    newX = ox;
                    newY = -oz;
                    newZ = oy;
                } else {
                    if (yaw === 90) {
                        newX = -oz;
                        newZ = ox;
                    } else if (yaw === -90) {
                        newX = oz;
                        newZ = -ox;
                    } else if (yaw === 180 || yaw === -180) {
                        newX = -ox;
                        newZ = -oz;
                    }
                }
                return [newX, newY, newZ];
            }

            if (relativeCoords && relativeCoords.length > 0) {
                relativeCoords.forEach(function(offset) {
                    if (offset.length === 3) {
                        var rotatedOffset = rotateCoords(offset);
                        var by = y + rotatedOffset[1];
                        if (byFeet && !isLookingDown && by < playerFeetY) return;

                        var block = world.getBlockAt(new Location(world, x + rotatedOffset[0], by, z + rotatedOffset[2]));
                        targetPlayer.breakBlock(block);
                    }
                });
            } else {
                var absX = Math.abs(direction.getX());
                var absY = Math.abs(direction.getY());
                var absZ = Math.abs(direction.getZ());

                var x1 = x, x2 = x;
                var y1 = y, y2 = y;
                var z1 = z, z2 = z;

                if (absY > absX && absY > absZ) {
                    x1 = x - range;
                    x2 = x + range;
                    z1 = z - range;
                    z2 = z + range;
                    if (direction.getY() > 0) {
                        y2 = y + depth;
                    } else {
                        y1 = y - depth;
                    }
                } else if (absX > absZ) {
                    y1 = y - range;
                    y2 = y + range;
                    z1 = z - range;
                    z2 = z + range;
                    if (direction.getX() > 0) {
                        x2 = x + depth;
                    } else {
                        x1 = x - depth;
                    }
                } else {
                    y1 = y - range;
                    y2 = y + range;
                    x1 = x - range;
                    x2 = x + range;
                    if (direction.getZ() > 0) {
                        z2 = z + depth;
                    } else {
                        z1 = z - depth;
                    }
                }

                for (var bx = x1; bx <= x2; bx++) {
                    for (var by = y1; by <= y2; by++) {
                        if (byFeet && !isLookingDown && by < playerFeetY) continue;
                        for (var bz = z1; bz <= z2; bz++) {
                            var block = world.getBlockAt(new Location(world, bx, by, bz));
                            targetPlayer.breakBlock(block);
                        }
                    }
                }
            }
        }
    });

    var playerBreakBlockInstance = new PlayerBreakBlockAction("player_break_block");
    
    return playerBreakBlockInstance;
}

CEplayerBreakBlock();