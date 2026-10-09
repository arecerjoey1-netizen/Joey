# Open Road — Unity Car Game Starter

An original CPM2-inspired driving prototype for Windows PC and Android. This is a starter codebase, not a finished commercial game: the scripts provide core gameplay systems, while you supply/import licensed 3D vehicle and environment assets.

## Prototype features
- WheelCollider-based vehicle controller with steering, throttle, braking, handbrake, and speed readout.
- Chase camera with smooth follow.
- Parking-zone trigger that detects when the car stops inside a marked bay.
- Runtime paint-color and wheel-size customization hooks.
- Keyboard controls on PC and on-screen touch controls on Android.

## Recommended setup
1. Install Unity Hub and a current Unity LTS release. Add Android Build Support, Android SDK & NDK Tools, and OpenJDK if building Android.
2. Create a 3D (URP) project named OpenRoad.
3. Copy the C# files from this folder into Assets/Scripts/OpenRoad/.
4. Create a car root GameObject with a Rigidbody (mass around 1300), a body mesh, and four WheelCollider objects aligned with the wheel meshes. Add VehicleController to the root and assign the colliders and wheel transforms in the Inspector.
5. Add VehicleInput to the car root. The sample uses Unity's classic Input Manager axes (Horizontal, Vertical, Jump). In Project Settings > Player, set Active Input Handling to Input Manager (Old) or Both.
6. Add ChaseCamera to the camera and assign the car transform as Target.
7. Create a parking bay with a BoxCollider set to Is Trigger, add ParkingZone, and ensure the car has a Rigidbody and collider.
8. Add CarCustomization to the car root; assign the body Renderer and optional wheel transforms.
9. Build a city block from modular road/building assets. Bake lighting, use LOD Groups on buildings, use occlusion culling where useful, and keep real-time shadows moderate for Android.

## Controls
- W / Up: throttle
- S / Down: brake / reverse input (the sample brakes; add reverse gearing for a full drivetrain)
- A,D / Left,Right: steering
- Space: handbrake
- Android: create UI buttons and connect pointer down/up to VehicleInput.SetThrottle, SetBrake, SetLeft, SetRight, and SetHandbrake. Use EventTrigger or a pointer handler to send both press and release.

## Important implementation notes
- WheelCollider suspension, friction curves, and wheel alignment need tuning per vehicle.
- This prototype does not yet include multiplayer, traffic AI, save-game/cloud sync, production UI, or final assets.
- Do not use CPM2's name, models, maps, textures, sounds, or other proprietary assets in your published game. Use original or properly licensed content.
