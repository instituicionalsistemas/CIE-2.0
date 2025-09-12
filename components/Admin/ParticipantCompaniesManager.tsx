import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    getParticipantCompaniesByEvent, 
    addParticipantCompany, 
    updateParticipantCompany, 
    deleteParticipantCompany, 
    getButtonConfigs, 
    uploadImage, 
    getCollaboratorsByCompany, 
    addCollaborator, 
    updateCollaborator,
    deleteCollaborator,
    getVehiclesByCompany,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    apiBulkAddVehicles
} from '../../services/api';
import { ParticipantCompany, ReportButtonConfig, Collaborator, Vehicle } from '../../types';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import LoadingSpinner from '../LoadingSpinner';
import ConfirmationModal from '../ConfirmationModal';

interface Props {
  eventId: string;
}

const emptyCompany: Omit<ParticipantCompany, 'id'> = {
  name: '', boothCode: '', buttonIds: [], responsible: '', contact: '', responsiblePhone: '', eventId: '', logoUrl: ''
};

// FIX: Added missing 'companyId' property to the `emptyCollaborator` object and updated its type to `Omit<Collaborator, 'id' | 'createdAt'>`. This resolves a TypeScript error where the initial value for the `currentCollaborator` state was missing a required property defined in its type annotation.
const emptyCollaborator: Omit<Collaborator, 'id' | 'createdAt'> = {
  name: '',
  collaboratorCode: '',
  companyId: '',
  email: '',
  phone: '',
  role: '',
  photoUrl: 'https://aisfizoyfpcisykarrnt.supabase.co/storage/v1/object/public/molduras/Screenshot%202025-08-25%20182827.png'
};

const DEFAULT_VEHICLE_PHOTO = 'https://ngukhhydpltectxrmvot.supabase.co/storage/v1/object/public/imagens/WhatsApp%20Image%202025-09-10%20at%2023.55.44.jpeg';

// FIX: Added missing 'status' property to align with the Vehicle type definition.
const emptyVehicle: Omit<Vehicle, 'id' | 'createdAt'> = {
  marca: '',
  model: '',
  photoUrl: DEFAULT_VEHICLE_PHOTO,
  companyId: '',
  status: 'Disponível'
};

const ParticipantCompaniesManager: React.FC<Props> = ({ eventId }) => {
  const [companies, setCompanies] = useState<ParticipantCompany[]>([]);
  const [allButtons, setAllButtons] = useState<ReportButtonConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Omit<ParticipantCompany, 'id'> | ParticipantCompany>({...emptyCompany, eventId});
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileName, setLogoFileName] = useState('');

  // State for Collaborators Modal
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<ParticipantCompany | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [isSubmittingCollaborator, setIsSubmittingCollaborator] = useState(false);
  const [collaboratorToDelete, setCollaboratorToDelete] = useState<string | null>(null);
  const [isConfirmCollaboratorDeleteOpen, setIsConfirmCollaboratorDeleteOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [currentCollaborator, setCurrentCollaborator] = useState<Omit<Collaborator, 'id' | 'createdAt'> | Collaborator>(emptyCollaborator);
  const [isEditingCollaborator, setIsEditingCollaborator] = useState(false);


  // State for Vehicle Stock Modal
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Omit<Vehicle, 'id' | 'createdAt'> | Vehicle>(emptyVehicle);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState<File | null>(null);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [isConfirmVehicleDeleteOpen, setIsConfirmVehicleDeleteOpen] = useState(false);

  // State for Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Refs for camera functionality
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [companiesData, buttonsData] = await Promise.all([getParticipantCompaniesByEvent(eventId), getButtonConfigs()]);
      setCompanies(companiesData);
      setAllButtons(buttonsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect to fetch collaborators when a company is selected
  useEffect(() => {
    if (selectedCompany && isCollaboratorModalOpen) {
      const fetchCollaborators = async () => {
        setCollaboratorsLoading(true);
        try {
          const data = await getCollaboratorsByCompany(selectedCompany.id);
          setCollaborators(data);
        } catch (error) {
          console.error("Failed to fetch collaborators", error);
        } finally {
          setCollaboratorsLoading(false);
        }
      };
      fetchCollaborators();
    }
  }, [selectedCompany, isCollaboratorModalOpen]);
  
  // Effect to fetch vehicles when a company is selected for the vehicle modal
  useEffect(() => {
    if (selectedCompany && isVehicleModalOpen) {
        const fetchVehicles = async () => {
            setVehiclesLoading(true);
            try {
                const data = await getVehiclesByCompany(selectedCompany.id);
                setVehicles(data);
            } catch (error) {
                console.error("Failed to fetch vehicles", error);
            } finally {
                setVehiclesLoading(false);
            }
        };
        fetchVehicles();
    }
  }, [selectedCompany, isVehicleModalOpen]);

  const handleOpenModal = (company?: ParticipantCompany) => {
    setLogoFile(null);
    setLogoFileName('');
    if (company) {
      setCurrentCompany({ ...company });
      setIsEditing(true);
    } else {
      setCurrentCompany({...emptyCompany, eventId});
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => setIsModalOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'boothCode' ? value.toUpperCase().replace(/\s/g, '') : value;
    setCurrentCompany(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setLogoFile(file);
        setLogoFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
            setCurrentCompany(prev => ({ ...prev, logoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setCurrentCollaborator(prev => ({ ...prev, photoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };


  const handleButtonToggle = (buttonId: string) => {
    const currentButtonIds = currentCompany.buttonIds || [];
    const newButtonIds = currentButtonIds.includes(buttonId)
      ? currentButtonIds.filter(id => id !== buttonId)
      : [...currentButtonIds, buttonId];
    setCurrentCompany(prev => ({...prev, buttonIds: newButtonIds}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyData = { ...currentCompany };
    
    try {
      if (logoFile) {
        const newLogoUrl = await uploadImage(logoFile);
        companyData.logoUrl = newLogoUrl;
      }
      
      if (isEditing) {
        await updateParticipantCompany(companyData as ParticipantCompany);
      } else {
        await addParticipantCompany(companyData as Omit<ParticipantCompany, 'id'>);
      }
      fetchData();
      handleCloseModal();
    } catch(error) {
        console.error("Failed to submit company data", error);
    }
  };
  
  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteParticipantCompany(itemToDelete);
      fetchData();
      setItemToDelete(null);
      setIsConfirmModalOpen(false);
    }
  };

  // --- Collaborator Functions ---
  const handleOpenCollaboratorsModal = (company: ParticipantCompany) => {
    setSelectedCompany(company);
    handleAddNewCollaborator(); // Resets form
    setIsCollaboratorModalOpen(true);
  };

  const handleCloseCollaboratorsModal = () => {
    setIsCollaboratorModalOpen(false);
    setSelectedCompany(null);
    setCollaborators([]);
  };
  
  const handleCollaboratorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'collaboratorCode' ? value.toUpperCase().replace(/\s/g, '') : value;
    setCurrentCollaborator(prev => ({ ...prev, [name]: finalValue }));
  };
  
  const handleAddNewCollaborator = () => {
    setCurrentCollaborator({ ...emptyCollaborator, companyId: selectedCompany?.id || '' });
    setIsEditingCollaborator(false);
    setPhotoFile(null);
  };

  const handleEditCollaborator = (collaborator: Collaborator) => {
    setCurrentCollaborator(collaborator);
    setIsEditingCollaborator(true);
    setPhotoFile(null);
    document.getElementById('collaborator-modal-content')?.scrollTo(0, 0);
  };

  const handleSubmitCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setIsSubmittingCollaborator(true);
    
    let dataToSubmit = { ...currentCollaborator };
    
    try {
        if (photoFile) {
            const newPhotoUrl = await uploadImage(photoFile);
            dataToSubmit.photoUrl = newPhotoUrl;
        }

        if (isEditingCollaborator) {
            await updateCollaborator(dataToSubmit as Collaborator);
        } else {
            await addCollaborator({ ...dataToSubmit, companyId: selectedCompany.id } as Omit<Collaborator, 'id' | 'createdAt'>);
        }
        
        const data = await getCollaboratorsByCompany(selectedCompany.id);
        setCollaborators(data);
        handleAddNewCollaborator(); // Reset form for next entry
        
    } catch (error) {
        console.error("Failed to submit collaborator", error);
    } finally {
        setIsSubmittingCollaborator(false);
    }
  };

  const handleDeleteCollaboratorClick = (id: string) => {
    setCollaboratorToDelete(id);
    setIsConfirmCollaboratorDeleteOpen(true);
  };

  const handleConfirmCollaboratorDelete = async () => {
    if (collaboratorToDelete && selectedCompany) {
      try {
        await deleteCollaborator(collaboratorToDelete);
        const data = await getCollaboratorsByCompany(selectedCompany.id);
        setCollaborators(data);
      } catch (error) {
          console.error("Failed to delete collaborator", error);
      } finally {
        setCollaboratorToDelete(null);
        setIsConfirmCollaboratorDeleteOpen(false);
      }
    }
  };
  
  // --- Vehicle Functions ---
    const handleOpenVehicleModal = (company: ParticipantCompany) => {
        setSelectedCompany(company);
        setCurrentVehicle({ ...emptyVehicle, companyId: company.id });
        setIsEditingVehicle(false);
        setVehiclePhotoFile(null);
        setIsVehicleModalOpen(true);
    };

    const handleCloseVehicleModal = () => {
        stopCamera();
        setIsVehicleModalOpen(false);
        setSelectedCompany(null);
        setVehicles([]);
    };

    const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentVehicle(prev => ({ ...prev, [name]: value }));
    };

    const handleVehiclePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setVehiclePhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentVehicle(prev => ({ ...prev, photoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditVehicle = (vehicle: Vehicle) => {
        setCurrentVehicle(vehicle);
        setIsEditingVehicle(true);
        setVehiclePhotoFile(null);
        document.getElementById('vehicle-modal-content')?.scrollTo(0, 0);
    };

    const handleCancelEditVehicle = () => {
        if (selectedCompany) {
            setCurrentVehicle({ ...emptyVehicle, companyId: selectedCompany.id });
        }
        setIsEditingVehicle(false);
        setVehiclePhotoFile(null);
    };

    const handleVehicleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany) return;
        setIsSubmittingVehicle(true);
        
        const vehicleData = { ...currentVehicle };

        try {
            if (vehiclePhotoFile) {
                const newPhotoUrl = await uploadImage(vehiclePhotoFile);
                vehicleData.photoUrl = newPhotoUrl;
            }

            if (isEditingVehicle) {
                await updateVehicle(vehicleData as Vehicle);
            } else {
                await addVehicle(vehicleData as Omit<Vehicle, 'id' | 'createdAt'>);
            }

            handleCancelEditVehicle();
            const data = await getVehiclesByCompany(selectedCompany.id);
            setVehicles(data);

        } catch (error) {
            console.error("Failed to save vehicle", error);
        } finally {
            setIsSubmittingVehicle(false);
        }
    };

    const handleDeleteVehicleClick = (id: string) => {
        setVehicleToDelete(id);
        setIsConfirmVehicleDeleteOpen(true);
    };

    const handleConfirmVehicleDelete = async () => {
        if (vehicleToDelete && selectedCompany) {
            try {
                await deleteVehicle(vehicleToDelete);
                const data = await getVehiclesByCompany(selectedCompany.id);
                setVehicles(data);
            } catch (error) {
                console.error("Failed to delete vehicle", error);
            } finally {
                setVehicleToDelete(null);
                setIsConfirmVehicleDeleteOpen(false);
            }
        }
    };

    // --- Camera Functions ---
    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setIsCameraOpen(true);
            } catch (err) {
                console.error("Error accessing camera: ", err);
                alert("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const dataURLtoFile = (dataurl: string, filename: string): File => {
        let arr = dataurl.split(','),
            mimeMatch = arr[0].match(/:(.*?);/),
            mime = mimeMatch ? mimeMatch[1] : 'image/jpeg',
            bstr = atob(arr[1]), 
            n = bstr.length, 
            u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    }

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            const file = dataURLtoFile(dataUrl, `capture-${Date.now()}.jpg`);
            
            setVehiclePhotoFile(file);
            setCurrentVehicle(prev => ({ ...prev, photoUrl: dataUrl }));
            stopCamera();
        }
    };

    // --- Import Functions ---
    const handleOpenImportModal = () => {
        setImportError(null);
        setImportSuccessMessage(null);
        setIsImportModalOpen(true);
    };

    const handleDownloadTemplate = () => {
        const headers = 'Marca,Modelo,"Foto (URL)",Status';
        const csvContent = "data:text/csv;charset=utf-8," + headers;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_estoque.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileImport = (file: File) => {
        if (!selectedCompany) return;
        setIsImporting(true);
        setImportError(null);
        setImportSuccessMessage(null);

        (window as any).Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results: any) => {
                const requiredColumns = ['Marca', 'Modelo'];
                const fileColumns = results.meta.fields;

                if (!requiredColumns.every(col => fileColumns.includes(col))) {
                    setImportError(`O arquivo precisa conter as colunas obrigatórias: ${requiredColumns.join(', ')}.`);
                    setIsImporting(false);
                    return;
                }

                const newVehicles: Omit<Vehicle, 'id' | 'createdAt'>[] = results.data
                    .map((row: any) => {
                        const marca = row['Marca']?.trim();
                        const model = row['Modelo']?.trim();
                        if (!marca || !model) {
                            return null;
                        }
                        return {
                            marca,
                            model,
                            photoUrl: row['Foto (URL)']?.trim() || DEFAULT_VEHICLE_PHOTO,
                            status: ['Disponível', 'Vendido'].includes(row['Status']?.trim()) ? row['Status'].trim() : 'Disponível',
                            companyId: selectedCompany.id,
                        };
                    })
                    .filter((v: any): v is Omit<Vehicle, 'id' | 'createdAt'> => v !== null);

                if (newVehicles.length === 0) {
                    setImportError('Nenhum veículo válido encontrado na planilha.');
                    setIsImporting(false);
                    return;
                }

                try {
                    await apiBulkAddVehicles(newVehicles);
                    setImportSuccessMessage(`${newVehicles.length} veículo(s) importado(s) com sucesso!`);
                    
                    const data = await getVehiclesByCompany(selectedCompany.id);
                    setVehicles(data);

                    setTimeout(() => {
                        setIsImportModalOpen(false);
                    }, 2000);

                } catch (error) {
                    setImportError('Ocorreu um erro ao importar os veículos.');
                } finally {
                    setIsImporting(false);
                }
            },
            error: (error: any) => {
                setImportError('Falha ao ler o arquivo CSV.');
                setIsImporting(false);
            }
        });
    };


  const filteredCompanies = useMemo(() =>
    companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.boothCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.responsible?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [companies, searchTerm]
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="hidden md:block text-3xl font-bold">Gerenciar Empresas Participantes</h2>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
          <Input id="search" label="" placeholder="Buscar empresa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-64 mb-0" />
          <Button onClick={() => handleOpenModal()} className="flex-shrink-0">Adicionar Empresa</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map(company => {
          const companyButtons = allButtons.filter(b => company.buttonIds.includes(b.id));

          return (
            <div key={company.id} className="bg-card p-5 rounded-lg shadow-md flex flex-col justify-between">
              <div className="flex-grow">
                <div className="flex items-start gap-4 mb-3">
                  <img src={company.logoUrl || 'https://via.placeholder.com/150?text=Logo'} alt={`${company.name} logo`} className="w-16 h-16 object-contain rounded-md bg-secondary p-1 flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                      <h3 className="text-xl font-bold text-primary truncate">{company.name}</h3>
                      <p className="text-sm text-text-secondary">Cód. Estande: {company.boothCode}</p>
                  </div>
                </div>
                <div className="border-t border-border my-3"></div>
                <p><strong>Responsável:</strong> {company.responsible || 'N/D'}</p>
                <p><strong>Email:</strong> {company.contact || 'N/D'}</p>
                <p className="mb-3"><strong>Telefone:</strong> {company.responsiblePhone || 'N/D'}</p>
                
                <div className="border-t border-border pt-3 mt-3">
                    <h4 className="font-semibold mb-2 text-sm">Botões de Ação:</h4>
                    {companyButtons.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {companyButtons.map(b => (
                                <span key={b.id} className="text-xs bg-secondary text-primary font-medium py-1 px-2 rounded-full">
                                    {b.label}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary">Nenhum botão configurado.</p>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border flex-shrink-0">
                <Button variant="secondary" onClick={() => handleOpenModal(company)} className="text-sm w-full">Editar</Button>
                <Button variant="secondary" onClick={() => handleOpenCollaboratorsModal(company)} className="text-sm w-full">Colaboradores</Button>
                <Button variant="secondary" onClick={() => handleOpenVehicleModal(company)} className="text-sm w-full">Estoque</Button>
                <Button variant="danger" onClick={() => handleDeleteClick(company.id)} className="text-sm w-full col-span-3">Excluir</Button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Editar Empresa' : 'Adicionar Empresa'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="name" name="name" label="Nome da Empresa" value={currentCompany.name} onChange={handleChange} required />
          <Input id="boothCode" name="boothCode" label="Código do Estande" value={currentCompany.boothCode} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-medium mb-1">
                Logo da Empresa
            </label>
            <div className="mt-2 flex items-center gap-4">
                {currentCompany.logoUrl && (
                    <img src={currentCompany.logoUrl} alt="Logo preview" className="h-16 w-16 object-contain rounded-md bg-secondary" />
                )}
                <div className="flex items-center">
                    <label htmlFor="logoUrl" className="cursor-pointer inline-block bg-primary hover:bg-primary-dark text-black font-bold py-2 px-4 rounded-lg transition-colors">
                        Upload de arquivo
                    </label>
                    <input
                        id="logoUrl"
                        name="logoUrl"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <span className="ml-3 text-sm text-text-secondary truncate max-w-xs">{logoFileName || 'Nenhum arquivo selecionado'}</span>
                </div>
            </div>
          </div>
          <Input id="responsible" name="responsible" label="Responsável" value={currentCompany.responsible || ''} onChange={handleChange} />
          <Input id="contact" name="contact" label="Email de Contato" type="email" value={currentCompany.contact || ''} onChange={handleChange} />
          <Input id="responsiblePhone" name="responsiblePhone" label="Telefone do Responsável" type="tel" value={currentCompany.responsiblePhone || ''} onChange={handleChange} />
          
          <div>
            <h4 className="font-semibold mb-2">Botões de Ação Associados</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                {allButtons.map(button => (
                    <label key={button.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary">
                        <input
                            type="checkbox"
                            checked={currentCompany.buttonIds.includes(button.id)}
                            onChange={() => handleButtonToggle(button.id)}
                            className="form-checkbox rounded text-primary focus:ring-primary bg-background border-border"
                        />
                        <span className="truncate">{button.label}</span>
                    </label>
                ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Collaborators Modal */}
      <Modal isOpen={isCollaboratorModalOpen} onClose={handleCloseCollaboratorsModal} title={`Colaboradores de ${selectedCompany?.name}`}>
        <div id="collaborator-modal-content" className="space-y-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmitCollaborator} className="space-y-4 p-4 border border-border rounded-lg bg-secondary">
              <h3 className="text-lg font-semibold">{isEditingCollaborator ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}</h3>
              <div className="flex items-center gap-4">
                  <img src={currentCollaborator.photoUrl || 'https://via.placeholder.com/150'} alt="Preview" className="w-16 h-16 rounded-full object-cover"/>
                  <div>
                      <label htmlFor="collaborator-photo-upload" className="cursor-pointer bg-secondary hover:bg-secondary-hover text-text font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                          Escolher Foto
                      </label>
                      <input id="collaborator-photo-upload" type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" />
                  </div>
              </div>
              <Input id="name" name="name" label="Nome Completo" value={currentCollaborator.name} onChange={handleCollaboratorChange} required />
              <Input id="collaboratorCode" name="collaboratorCode" label="Código do Colaborador" value={currentCollaborator.collaboratorCode} onChange={handleCollaboratorChange} required />
              <Input id="role" name="role" label="Cargo / Função" value={currentCollaborator.role || ''} onChange={handleCollaboratorChange} />
              <Input id="email" name="email" label="Email" type="email" value={currentCollaborator.email || ''} onChange={handleCollaboratorChange} />
              <Input id="phone" name="phone" label="Telefone" type="tel" value={currentCollaborator.phone || ''} onChange={handleCollaboratorChange} />

              <div className="flex justify-end gap-2">
                  {isEditingCollaborator && <Button type="button" variant="secondary" onClick={handleAddNewCollaborator}>Cancelar Edição</Button>}
                  <Button type="submit" disabled={isSubmittingCollaborator}>
                      {isSubmittingCollaborator ? <div className="flex justify-center items-center h-5 w-32"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div></div> : (isEditingCollaborator ? 'Salvar Alterações' : 'Adicionar Colaborador')}
                  </Button>
              </div>
          </form>

          <div className="border-t border-border pt-4">
            <h4 className="font-semibold mb-2">Colaboradores Cadastrados</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {collaboratorsLoading ? <LoadingSpinner /> : (
                collaborators.length > 0 ? collaborators.map(collab => (
                  <div key={collab.id} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                    <div className="flex items-center gap-3 flex-grow overflow-hidden">
                        <img src={collab.photoUrl || 'https://via.placeholder.com/150'} alt={collab.collaboratorCode} className="w-10 h-10 rounded-full object-cover" />
                        <div className="truncate">
                          <p className="font-semibold truncate">{collab.name}</p>
                          <p className="text-sm text-text-secondary truncate">{collab.collaboratorCode}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="secondary" className="py-1 px-2 text-xs" onClick={() => handleEditCollaborator(collab)}>Editar</Button>
                      <Button variant="danger" className="py-1 px-2 text-xs" onClick={() => handleDeleteCollaboratorClick(collab.id)}>Excluir</Button>
                    </div>
                  </div>
                )) : <p className="text-center text-text-secondary py-4">Nenhum colaborador cadastrado.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Vehicle Stock Modal */}
      <Modal isOpen={isVehicleModalOpen} onClose={handleCloseVehicleModal} title={`Estoque de Veículos de ${selectedCompany?.name}`}>
        {isCameraOpen && (
            <div className="absolute inset-0 bg-black bg-opacity-90 z-10 flex flex-col items-center justify-center p-4">
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded-lg mb-4"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="flex gap-4">
                <Button onClick={capturePhoto}>Capturar Foto</Button>
                <Button variant="secondary" onClick={stopCamera}>Cancelar</Button>
            </div>
            </div>
        )}
        <div id="vehicle-modal-content" className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleOpenImportModal}>Importar Planilha</Button>
            </div>
            <form onSubmit={handleVehicleSubmit} className="p-4 border border-border rounded-lg space-y-4 bg-secondary">
                <h3 className="text-lg font-semibold">{isEditingVehicle ? 'Editar Veículo' : 'Adicionar Novo Veículo'}</h3>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-shrink-0">
                    <img src={(currentVehicle as Vehicle).photoUrl || DEFAULT_VEHICLE_PHOTO} alt="Preview" className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover bg-background" />
                    </div>
                    <div className="flex-grow space-y-2 w-full">
                    <Button type="button" onClick={startCamera} className="w-full">Tirar Foto</Button>
                    <label htmlFor="vehicle-photo-upload" className="cursor-pointer w-full inline-block text-center bg-secondary hover:bg-secondary-hover text-text font-bold py-2 px-4 rounded-lg transition-colors">
                        Enviar Arquivo
                    </label>
                    <input id="vehicle-photo-upload" type="file" accept="image/*" onChange={handleVehiclePhotoFileChange} className="hidden" />
                    </div>
                </div>
                <Input id="vehicle-marca" name="marca" label="Marca do Veículo" value={(currentVehicle as Vehicle).marca} onChange={handleVehicleChange} required />
                <Input id="vehicle-model" name="model" label="Modelo" value={(currentVehicle as Vehicle).model} onChange={handleVehicleChange} required />
                <div className="flex justify-end gap-2">
                    {isEditingVehicle && <Button type="button" variant="secondary" onClick={handleCancelEditVehicle}>Cancelar Edição</Button>}
                    <Button type="submit" disabled={isSubmittingVehicle}>
                        {isSubmittingVehicle ? <div className="flex justify-center items-center h-5 w-36"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div></div> : (isEditingVehicle ? 'Salvar Alterações' : 'Adicionar Veículo')}
                    </Button>
                </div>
            </form>

            <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-2">Veículos Cadastrados</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {vehiclesLoading ? <LoadingSpinner /> : (
                    vehicles.length > 0 ? vehicles.map(vehicle => (
                        <div key={vehicle.id} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                        <div className="flex items-center gap-3">
                            <img src={vehicle.photoUrl} alt={vehicle.marca} className="w-12 h-12 rounded-md object-cover" />
                            <div>
                            <p className="font-semibold">{vehicle.marca}</p>
                            <p className="text-sm text-text-secondary">{vehicle.model}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" className="py-1 px-2 text-xs" onClick={() => handleEditVehicle(vehicle)}>Editar</Button>
                            <Button variant="danger" className="py-1 px-2 text-xs" onClick={() => handleDeleteVehicleClick(vehicle.id)}>Excluir</Button>
                        </div>
                        </div>
                    )) : <p className="text-center text-text-secondary py-4">Nenhum veículo cadastrado.</p>
                    )}
                </div>
            </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Importar Estoque via Planilha">
          <div className="space-y-4">
              <p className="text-text-secondary">Envie um arquivo <code className="bg-background text-primary px-1 rounded">.csv</code> com as colunas: <code className="bg-background text-primary px-1 rounded">Marca</code> (obrigatório), <code className="bg-background text-primary px-1 rounded">Modelo</code> (obrigatório), <code className="bg-background text-primary px-1 rounded">Foto (URL)</code> (opcional) e <code className="bg-background text-primary px-1 rounded">Status</code> (opcional, padrão 'Disponível').</p>
              
              <Button onClick={handleDownloadTemplate} variant="secondary" className="w-full">Baixar Planilha Modelo</Button>
              
              <input 
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files && handleFileImport(e.target.files[0])}
                  className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary-dark"
                  disabled={isImporting}
              />
              
              {isImporting && <div className="flex items-center gap-2"><LoadingSpinner /><p>Importando, por favor aguarde...</p></div>}
              {importError && <p className="text-red-500 text-sm">{importError}</p>}
              {importSuccessMessage && <p className="text-green-500 text-sm font-semibold">{importSuccessMessage}</p>}
          </div>
      </Modal>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta empresa?"
        confirmText="Excluir"
      />
      <ConfirmationModal
        isOpen={isConfirmCollaboratorDeleteOpen}
        onClose={() => setIsConfirmCollaboratorDeleteOpen(false)}
        onConfirm={handleConfirmCollaboratorDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este colaborador?"
        confirmText="Excluir"
      />
       <ConfirmationModal
        isOpen={isConfirmVehicleDeleteOpen}
        onClose={() => setIsConfirmVehicleDeleteOpen(false)}
        onConfirm={handleConfirmVehicleDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este veículo do estoque?"
        confirmText="Excluir"
      />
    </div>
  );
};

export default ParticipantCompaniesManager;