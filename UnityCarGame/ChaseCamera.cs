using UnityEngine;

public sealed class ChaseCamera : MonoBehaviour
{
    public Transform target;
    public Vector3 offset = new Vector3(0f, 3.2f, -7.5f);
    [Range(1f, 15f)] public float positionSmooth = 6f;
    [Range(1f, 15f)] public float rotationSmooth = 5f;
    public float lookAhead = 4f;

    private void LateUpdate()
    {
        if (!target) return;

        Vector3 desiredPosition = target.TransformPoint(offset);
        transform.position = Vector3.Lerp(transform.position, desiredPosition,
            1f - Mathf.Exp(-positionSmooth * Time.deltaTime));

        Vector3 lookPoint = target.position + target.forward * lookAhead + Vector3.up * 1.2f;
        Quaternion desiredRotation = Quaternion.LookRotation(lookPoint - transform.position, Vector3.up);
        transform.rotation = Quaternion.Slerp(transform.rotation, desiredRotation,
            1f - Mathf.Exp(-rotationSmooth * Time.deltaTime));
    }
}
