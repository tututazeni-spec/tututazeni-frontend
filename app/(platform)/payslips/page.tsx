// Os Recibos Salariais deixaram de ser um módulo independente (payroll.md):
// vivem agora no Payroll. Esta rota fica só para não partir links antigos.
import { redirect } from 'next/navigation';

export default function PayslipsPage() {
  redirect('/payroll');
}
