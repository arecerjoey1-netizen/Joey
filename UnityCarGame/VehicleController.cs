using UnityEngine;

/// <summary>Simple, tunable WheelCollider drivetrain for the first playable prototype.</summary>
[RequireComponent(typeof(Rigidbody))]
public sealed class VehicleController : MonoBehaviour
{
    [Header("Wheel colliders")]
    public WheelCollider frontLeft;
    public WheelCollider frontRight;
    public WheelCollider rearLeft;
    public WheelCollider rearRight;

    [Header("Wheel visuals")]
    public Transform frontLeftMesh;
    public Transform frontRightMesh;
    public Transform rearLeftMesh;
    public Transform rearRightMesh;

    [Header("Driving")]
    [Min(100f)] public float motorTorque = 1500f;
    [Min(100f)] public float brakeTorque = 3200f;
    [Range(10f, 40f)] public float maxSteerAngle = 30f;
    [Min(0f)] public float handbrakeTorque = 5500f;
    [Min(10f)] public float maxSpeedKmh = 180f;
    public bool frontWheelDrive = false;

    private Rigidbody body;
    private VehicleInput input;

    public float SpeedKmh => body == null ? 0f : body.velocity.magnitude * 3.6f;
    public bool IsNearlyStopped => SpeedKmh < 2.0f;

    private void Awake()
    {
        body = GetComponent<Rigidbody>();
        input = GetComponent<VehicleInput>();
        body.mass = Mathf.Max(body.mass, 500f);
        body.interpolation = RigidbodyInterpolation.Interpolate;
        body.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
        body.centerOfMass += new Vector3(0f, -0.35f, 0f);
    }

    private void FixedUpdate()
    {
        if (input == null || !WheelsAssigned()) return;

        float speedFactor = Mathf.InverseLerp(maxSpeedKmh, maxSpeedKmh * 0.35f, SpeedKmh);
        float torque = SpeedKmh >= maxSpeedKmh && input.Throttle > 0f
            ? 0f : motorTorque * input.Throttle * Mathf.Clamp01(speedFactor);

        frontLeft.steerAngle = input.Steering * maxSteerAngle;
        frontRight.steerAngle = input.Steering * maxSteerAngle;

        if (frontWheelDrive)
        {
            frontLeft.motorTorque = torque * 0.5f;
            frontRight.motorTorque = torque * 0.5f;
            rearLeft.motorTorque = rearRight.motorTorque = 0f;
        }
        else
        {
            rearLeft.motorTorque = torque * 0.5f;
            rearRight.motorTorque = torque * 0.5f;
            frontLeft.motorTorque = frontRight.motorTorque = 0f;
        }

        float brakes = input.Brake ? brakeTorque : 0f;
        frontLeft.brakeTorque = frontRight.brakeTorque = brakes;
        rearLeft.brakeTorque = rearRight.brakeTorque =
            brakes + (input.Handbrake ? handbrakeTorque : 0f);

        SyncWheel(frontLeft, frontLeftMesh);
        SyncWheel(frontRight, frontRightMesh);
        SyncWheel(rearLeft, rearLeftMesh);
        SyncWheel(rearRight, rearRightMesh);
    }

    private bool WheelsAssigned() =>
        frontLeft && frontRight && rearLeft && rearRight;

    private static void SyncWheel(WheelCollider collider, Transform visual)
    {
        if (!visual) return;
        collider.GetWorldPose(out Vector3 position, out Quaternion rotation);
        visual.SetPositionAndRotation(position, rotation);
    }
}
