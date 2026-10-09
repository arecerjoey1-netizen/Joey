using UnityEngine;

/// <summary>Keyboard input plus public methods for mobile UI buttons.</summary>
public sealed class VehicleInput : MonoBehaviour
{
    public float Throttle { get; private set; }
    public float Steering { get; private set; }
    public bool Brake { get; private set; }
    public bool Handbrake { get; private set; }

    private bool mobileThrottle, mobileBrake, mobileLeft, mobileRight, mobileHandbrake;

    private void Update()
    {
        float keyboardSteer = Input.GetAxisRaw("Horizontal");
        float keyboardThrottle = Input.GetAxisRaw("Vertical");

        Steering = Mathf.Abs(keyboardSteer) > 0.01f
            ? keyboardSteer
            : (mobileLeft == mobileRight ? 0f : mobileLeft ? -1f : 1f);

        Throttle = Mathf.Abs(keyboardThrottle) > 0.01f
            ? Mathf.Clamp01(keyboardThrottle)
            : (mobileThrottle ? 1f : 0f);

        Brake = keyboardThrottle < -0.01f || mobileBrake;
        Handbrake = Input.GetKey(KeyCode.Space) || mobileHandbrake;
    }

    public void SetThrottle(bool pressed) => mobileThrottle = pressed;
    public void SetBrake(bool pressed) => mobileBrake = pressed;
    public void SetLeft(bool pressed) => mobileLeft = pressed;
    public void SetRight(bool pressed) => mobileRight = pressed;
    public void SetHandbrake(bool pressed) => mobileHandbrake = pressed;
}
