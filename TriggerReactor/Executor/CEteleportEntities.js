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
var UUID = Java.type("java.util.UUID");

function CEteleportEntities() {
    var TeleportEntitiesAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 5 || args.length > 6) {
                Bukkit.getLogger().warning("[CEActions] TELEPORT_ENTITIES ACTION: Invalid actionLine format! CORRECT FORMAT: teleport_entities: <entity_uuid|player_name>;<world>;<x>;<y>;<z>;(optional) <target_entity_uuid|target_player_name>");
                return;
            }

            var targetIdentifier = args[0];
            var worldName = args[1];
            var x = parseFloat(args[2]);
            var y = parseFloat(args[3]);
            var z = parseFloat(args[4]);
            var targetIdentifierToTeleport = args.length === 6 ? args[5] : null;

            if (isNaN(x) || isNaN(y) || isNaN(z) && targetIdentifierToTeleport == null) {
                Bukkit.getLogger().warning("[CEActions] TELEPORT_ENTITIES ACTION: Invalid coordinates provided.");
                return;
            }

            var targetEntity = null;
            try {
                targetEntity = Bukkit.getEntity(UUID.fromString(targetIdentifier));
            } catch (e) {
                targetEntity = Bukkit.getPlayer(targetIdentifier);
            }

            if (targetEntity == null) {
                Bukkit.getLogger().warning("[CEActions] TELEPORT_ENTITIES ACTION: Target entity or player not found: " + targetIdentifier);
                return;
            }

            var teleportTargetEntity = null;
            if (targetIdentifierToTeleport != null) {
                try {
                	teleportTargetEntity = Bukkit.getEntity(UUID.fromString(targetIdentifierToTeleport));
            	} catch (e) {
                	teleportTargetEntity = Bukkit.getPlayer(targetIdentifierToTeleport);
            	}

                if (teleportTargetEntity == null) {
                    Bukkit.getLogger().warning("[CEActions] TELEPORT_ENTITIES ACTION: Target entity or player to teleport not found: " + targetIdentifierToTeleport);
                    return;
                }

                targetEntity.teleport(teleportTargetEntity.getLocation());
                return;
            }

            var world = Bukkit.getWorld(worldName);
            if (world == null) {
                Bukkit.getLogger().warning("[CEActions] TELEPORT_ENTITIES ACTION: World not found: " + worldName);
                return;
            }

            var location = new Location(world, x, y, z);

            targetEntity.teleport(location);
        }
    });

    var teleportEntitiesInstance = new TeleportEntitiesAction("teleport_entities");

    return teleportEntitiesInstance;
}

CEteleportEntities();