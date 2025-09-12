import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    getVehiclesByCompany, 
    updateVehicle,
    getEventSalesData,
    sendTelaoNotification
} from '../services/api';
import { Vehicle, Collaborator, CompanySalesData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import SalesRankingModal from '../components/SalesRankingModal';

const CollaboratorPage: React.FC = () => {
  const { boothCode } = useParams<{ boothCode: string }>();
  const navigate = useNavigate();
  
  const [checkinInfo, setCheckinInfo] = useState<{ companyName: string; companyId: string; boothCode: string; collaborator: Collaborator; eventId: string; } | null>(null);
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isTelaoModalOpen, setIsTelaoModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [vehicleToUpdate, setVehicleToUpdate] = useState<Vehicle | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [salesData, setSalesData] = useState<CompanySalesData[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  useEffect(() => {
    const checkinInfoRaw = sessionStorage.getItem('collaboratorCheckinInfo');
    if (checkinInfoRaw) {
      try {
        const info = JSON.parse(checkinInfoRaw);
        setCheckinInfo(info);
        setCollaborator(info.collaborator);
      } catch (e) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);
  
  useEffect(() => {
    const fetchAllVehicles = async () => {
      if (checkinInfo?.companyId) {
        setLoading(true);
        try {
          const data = await getVehiclesByCompany(checkinInfo.companyId);
          setVehicles(data);
        } catch (err) {
          setError('Falha ao carregar dados de veículos.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAllVehicles();
  }, [checkinInfo]);

  useEffect(() => {
    const fetchSalesData = async () => {
        if (checkinInfo?.eventId) {
            setRankingLoading(true);
            try {
                const data = await getEventSalesData(checkinInfo.eventId);
                setSalesData(data);
            } catch (e) {
                console.error("Failed to fetch sales data for collaborator", e);
            } finally {
                setRankingLoading(false);
            }
        }
    };
    fetchSalesData();
  }, [checkinInfo]);

  const soldVehicles = useMemo(() => {
    return vehicles
      .filter(v => v.status === 'Vendido')
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
    });
  }, [vehicles]);

  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => v.status === 'Disponível');
  }, [vehicles]);

  const handleOpenTelaoModal = () => {
    setIsTelaoModalOpen(true);
  };

  const handleOpenRankingModal = () => {
      setIsRankingModalOpen(true);
  };
  
  const handleMarkAsSold = (vehicle: Vehicle) => {
    setVehicleToUpdate(vehicle);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSold = async () => {
    if (!vehicleToUpdate || !checkinInfo || !collaborator) return;
    try {
      const { updatedAt, ...vehicleData } = vehicleToUpdate;
      await updateVehicle({ 
          ...vehicleData, 
          status: 'Vendido',
          soldByCollaboratorId: collaborator.id
      });
      
      await sendTelaoNotification(
          checkinInfo.eventId,
          vehicleToUpdate,
          collaborator,
          checkinInfo.companyName
      );

      const [updatedVehicles, updatedSalesData] = await Promise.all([
          getVehiclesByCompany(checkinInfo.companyId),
          getEventSalesData(checkinInfo.eventId)
      ]);
      setVehicles(updatedVehicles);
      setSalesData(updatedSalesData);
    } catch (error) {
      console.error("Failed to update vehicle status", error);
    } finally {
      setIsConfirmModalOpen(false);
      setVehicleToUpdate(null);
    }
  };

  if (loading || !collaborator) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary">Painel do Colaborador</h1>
            <p className="text-text-secondary">Empresa: <span className="font-semibold text-text">{checkinInfo?.companyName}</span></p>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg shadow-lg text-center flex flex-col justify-center">
                <h2 className="text-lg font-semibold text-text-secondary">Total de Veículos Vendidos</h2>
                <p className="text-5xl font-bold text-primary mt-2">{soldVehicles.length}</p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button onClick={handleOpenTelaoModal} className="w-full text-lg py-3">
                    Solicitar Telão
                </Button>
                <Button onClick={handleOpenRankingModal} className="w-full text-lg py-3">
                    Ranking de Vendas
                </Button>
            </div>
        </div>

        <div>
            <h2 className="text-2xl font-bold mb-4">Histórico de Vendas</h2>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {soldVehicles.length > 0 ? (
                    soldVehicles.map(vehicle => (
                        <div key={vehicle.id} className="p-4 bg-card rounded-lg flex items-center gap-4">
                            <img src={vehicle.photoUrl} alt={vehicle.marca} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="font-bold text-text">{vehicle.marca}</p>
                                <p className="text-sm text-text-secondary">{vehicle.model}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-primary">Vendido em:</p>
                                <p className="text-sm text-text-secondary">
                                    {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleDateString('pt-BR') : 'Data indisponível'}
                                </p>
                                <p className="text-xs text-text-secondary">
                                    {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 bg-card rounded-lg">
                        <p className="text-text-secondary">Nenhum veículo vendido ainda.</p>
                    </div>
                )}
            </div>
        </div>

        <Modal isOpen={isTelaoModalOpen} onClose={() => setIsTelaoModalOpen(false)} title="Solicitar Telão: Marcar Veículo Vendido">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {
                    availableVehicles.length > 0 ? (
                        availableVehicles.map(vehicle => (
                            <div key={vehicle.id} className="p-4 bg-secondary rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <img src={vehicle.photoUrl} alt={vehicle.marca} className="w-16 h-16 rounded-lg object-cover" />
                                    <div>
                                        <p className="font-bold text-text">{vehicle.marca}</p>
                                        <p className="text-sm text-text-secondary">{vehicle.model}</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleMarkAsSold(vehicle)}
                                    className="w-full sm:w-auto flex-shrink-0"
                                >
                                    VENDIDO
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-text-secondary py-8">Nenhum veículo disponível no estoque.</p>
                    )
                }
            </div>
        </Modal>
        
        {rankingLoading ? <LoadingSpinner /> : (
            <SalesRankingModal 
                isOpen={isRankingModalOpen}
                onClose={() => setIsRankingModalOpen(false)}
                salesData={salesData}
            />
        )}

        <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={handleConfirmSold}
            title="Confirmar Venda"
            message={`Você confirma a venda do veículo "${vehicleToUpdate?.marca} - ${vehicleToUpdate?.model}"? Esta ação não pode ser desfeita.`}
            confirmText="Sim, confirmo"
        />
    </div>
  );
};

export default CollaboratorPage;