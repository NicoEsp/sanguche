import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FetitaAccessTab } from '@/components/admin-fetita/FetitaAccessTab';
import { FetitaConversationsTab } from '@/components/admin-fetita/FetitaConversationsTab';
import { FetitaOverviewTab } from '@/components/admin-fetita/FetitaOverviewTab';
import { FetitaQualityTab } from '@/components/admin-fetita/FetitaQualityTab';

/**
 * Admin de Fetita. La página sólo arma las pestañas: cada una pide sus datos,
 * así que nada se carga hasta que se abre.
 */
export default function AdminFetita() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Fetita</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consumo de la API de Claude, calidad de las respuestas y accesos de la beta
        </p>
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList className="w-full flex-nowrap justify-start overflow-x-auto">
          <TabsTrigger value="resumen" className="shrink-0 text-xs sm:text-sm">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="accesos" className="shrink-0 text-xs sm:text-sm">
            Accesos
          </TabsTrigger>
          <TabsTrigger value="conversaciones" className="shrink-0 text-xs sm:text-sm">
            Conversaciones
          </TabsTrigger>
          <TabsTrigger value="calidad" className="shrink-0 text-xs sm:text-sm">
            Calidad
          </TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">
          <FetitaOverviewTab />
        </TabsContent>
        <TabsContent value="accesos">
          <FetitaAccessTab />
        </TabsContent>
        <TabsContent value="conversaciones">
          <FetitaConversationsTab />
        </TabsContent>
        <TabsContent value="calidad">
          <FetitaQualityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
