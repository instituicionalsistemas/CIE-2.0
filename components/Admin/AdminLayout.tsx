import React from 'react';
import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const AdminLayout: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-black font-bold'
        : 'hover:bg-secondary-hover'
    }`;
  
  const showBackButton = user?.isMaster || (user?.role === UserRole.ORGANIZER && user.events && user.events.length > 1);
  const backButtonLink = user?.isMaster ? "/admin/events" : "/organizer/events";

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="md:w-64 flex-shrink-0">
        <nav className="space-y-2 bg-card p-4 rounded-lg shadow-md">
          {showBackButton && (
            <>
              <Link
                to={backButtonLink}
                className="flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-secondary-hover mb-2"
              >
                <BackArrowIcon />
                Voltar para Eventos
              </Link>
              <div className="border-b border-border my-2"></div>
            </>
          )}
          <NavLink to={`/admin/event/${eventId}/dashboard`} end className={navLinkClasses}>
            Dashboard
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/tasks`} className={navLinkClasses}>
            Tarefas Atribuídas
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/ranking`} className={navLinkClasses}>
            Ranking
          </NavLink>
           <NavLink to={`/admin/event/${eventId}/company-calls-dashboard`} className={navLinkClasses}>
            Painel de Chamados
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/telao-requests`} className={navLinkClasses}>
            Solicitações de Telão
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/companies`} className={navLinkClasses}>
            Empresas
          </NavLink>
           <NavLink to={`/admin/event/${eventId}/departments`} className={navLinkClasses}>
            Departamentos
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/staff`} className={navLinkClasses}>
            Equipe
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/buttons`} className={navLinkClasses}>
            Botões de Ação
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/sales-checkin`} className={navLinkClasses}>
            Check-in de Vendas
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/notify-call`} className={navLinkClasses}>
            Chamados (Equipe)
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/company-calls`} className={navLinkClasses}>
            Chamados (Empresas)
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/stock-control`} className={navLinkClasses}>
            Log de controle de estoque
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/stock-report`} className={navLinkClasses}>
            Movimentação de Estoque
          </NavLink>
          <NavLink to={`/admin/event/${eventId}/notifications`} className={navLinkClasses}>
            Configurar Notificações
          </NavLink>
        </nav>
      </aside>
      <div className="flex-grow">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;