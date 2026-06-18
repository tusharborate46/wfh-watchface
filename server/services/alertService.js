export async function sendUnknownFaceAlert({ employee, manager }) {
  const payload = {
    type: 'UNKNOWN_FACE',
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department
    },
    manager
  };

  if (process.env.ALERT_WEBHOOK_URL) {
    await fetch(process.env.ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return;
  }

  console.warn(
    '[alert] UNKNOWN_FACE recorded locally. Configure ALERT_WEBHOOK_URL to send manager notifications.',
    payload
  );
}
