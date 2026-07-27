import { redirect } from 'next/navigation';

export default function EmployeeLoginRedirect() {
  redirect('/login?redirect=/employee');
}
