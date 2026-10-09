using UnityEngine;
using UnityEngine.Events;

[RequireComponent(typeof(Collider))]
public sealed class ParkingZone : MonoBehaviour
{
    public float requiredStopSeconds = 2f;
    public float maxParkingSpeedKmh = 2f;
    public UnityEvent onParkingCompleted;

    private VehicleController candidate;
    private float stoppedTime;
    private bool completed;

    private void Reset()
    {
        GetComponent<Collider>().isTrigger = true;
    }

    private void OnTriggerEnter(Collider other)
    {
        VehicleController car = other.GetComponentInParent<VehicleController>();
        if (car == null) return;
        candidate = car;
        stoppedTime = 0f;
        completed = false;
    }

    private void OnTriggerExit(Collider other)
    {
        if (candidate == null || other.transform.root != candidate.transform) return;
        candidate = null;
        stoppedTime = 0f;
        completed = false;
    }

    private void Update()
    {
        if (candidate == null || completed) return;

        if (candidate.SpeedKmh <= maxParkingSpeedKmh)
        {
            stoppedTime += Time.deltaTime;
            if (stoppedTime >= requiredStopSeconds)
            {
                completed = true;
                onParkingCompleted?.Invoke();
                Debug.Log("Parking challenge completed!");
            }
        }
        else stoppedTime = 0f;
    }
}
