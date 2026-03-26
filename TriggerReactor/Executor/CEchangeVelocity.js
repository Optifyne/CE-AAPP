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
var Vector = Java.type("org.bukkit.util.Vector");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");

function CEchangeVelocity() {
    var ChangeVelocityAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 5) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_VELOCITY ACTION: Invalid actionLine format! CORRECT FORMAT: change_velocity: <entity_uuid|player_name>;<direction (may be UP, DOWN, FORWARD, BACKWARD, RIGHT, LEFT or any combination of them via _)>;<vertical_speed>;<horizontal_speed>;<relative_to_view (if you need the velocity to be applied relative to the view direction, may be \"true\" or \"false\")>;(optional) <X>;(optional) <Y>;(optional) <Z> (coordinates take precedence over all options except speed, and indicate to/from which point the entity will be attracted/repelled);(only in case of coordinates) <mode (repel or attract)>");
                return;
            }

            var targetIdentifier = args[0];
            var direction = args[1].toUpperCase();
            var verticalSpeed = parseFloat(args[2]);
            var horizontalSpeed = parseFloat(args[3]);
            var relativeToView = args[4].toLowerCase() === "true";

            var useTargetCoords = args.length >= 8;
            var targetX = useTargetCoords && args[5] ? parseFloat(args[5]) : null;
            var targetY = useTargetCoords && args[6] ? parseFloat(args[6]) : null;
            var targetZ = useTargetCoords && args[7] ? parseFloat(args[7]) : null;
            var coordsMode = useTargetCoords && args[8] ? args[8].trim().toLowerCase() : null;

            if (isNaN(horizontalSpeed) || isNaN(verticalSpeed) || 
                (useTargetCoords && (isNaN(targetX) || isNaN(targetY) || isNaN(targetZ)))) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_VELOCITY ACTION: Invalid speed or coordinate values!");
                return;
            }
            
            if (useTargetCoords && !coordsMode) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_VELOCITY ACTION: Invalid coordinates mode value! Use 'repel' or 'attract'");
                return;
            }

            var entity = null;
            try {
                entity = Bukkit.getEntity(UUID.fromString(targetIdentifier));
            } catch (e) {
                entity = Bukkit.getPlayer(targetIdentifier);
            }

            if (entity == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_VELOCITY ACTION: Entity not found (" + targetIdentifier + ")!");
                return;
            }

            var velocity = new Vector(0, 0, 0);

            if (useTargetCoords) {
                var entityLocation = entity.getLocation();
                var directionVector;

                switch (coordsMode) {
                    case "repel":
                        directionVector = new Vector(entityLocation.getX() - targetX, entityLocation.getY() - targetY, entityLocation.getZ() - targetZ);
                        break;
                    case "attract":
                        directionVector = new Vector(targetX - entityLocation.getX(), targetY - entityLocation.getY(), targetZ - entityLocation.getZ());
                        break;
                    default:
                        Bukkit.getLogger().warning("[CEActions] CHANGE_VELOCITY ACTION: Unknown coordinates mode: " + coordsMode + ". Use 'repel' or 'attract'.");
                        return;
                }

                var verticalComponent = directionVector.getY();
                directionVector.setY(0);

                directionVector = directionVector.normalize().multiply(horizontalSpeed);

                if (verticalComponent !== 0) {
                    var verticalDirection = verticalComponent > 0 ? 1 : -1;
                    directionVector.setY(verticalDirection * verticalSpeed);
                } else {
                    directionVector.setY(0);
                }

                velocity = directionVector;
            } else {
                var directions = direction.split("_");

                directions.forEach(function(dir) {
                    switch (dir) {
                        case "UP":
                            velocity.setY(velocity.getY() + verticalSpeed);
                            break;
                        case "DOWN":
                            velocity.setY(velocity.getY() - verticalSpeed);
                            break;
                        case "FORWARD":
                            if (relativeToView) {
                                velocity.add(entity.getLocation().getDirection().setY(0).normalize().multiply(horizontalSpeed));
                            } else {
                                velocity.setZ(velocity.getZ() + horizontalSpeed);
                            }
                            break;
                        case "BACKWARD":
                            if (relativeToView) {
                                velocity.add(entity.getLocation().getDirection().setY(0).normalize().multiply(-horizontalSpeed));
                            } else {
                                velocity.setZ(velocity.getZ() - horizontalSpeed);
                            }
                            break;
                        case "LEFT":
                            if (relativeToView) {
                                var leftVector = entity.getLocation().getDirection().setY(0).normalize()
                                    .rotateAroundY(Math.PI / 2).multiply(horizontalSpeed);
                                velocity.add(leftVector);
                            } else {
                                velocity.setX(velocity.getX() - horizontalSpeed);
                            }
                            break;
                        case "RIGHT":
                            if (relativeToView) {
                                var rightVector = entity.getLocation().getDirection().setY(0).normalize()
                                    .rotateAroundY(-Math.PI / 2).multiply(horizontalSpeed);
                                velocity.add(rightVector);
                            } else {
                                velocity.setX(velocity.getX() + horizontalSpeed);
                            }
                            break;
                        default:
                            Bukkit.getLogger().warning("[CEActions] CHANGE_VELOCITY ACTION: Unknown direction: " + dir);
                    }
                });
            }

            entity.setVelocity(velocity);
        }
    });

    var changeVelocityInstance = new ChangeVelocityAction("change_velocity");

    return changeVelocityInstance;
}

CEchangeVelocity();