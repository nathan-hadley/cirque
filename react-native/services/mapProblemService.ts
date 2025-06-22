import { Problem } from '@/models/problems';
import { useMapStore } from '@/stores/mapStore';
import { useProblemStore } from '@/stores/problemStore';
import { Feature, GeoJsonProperties, Point } from 'geojson';

type NavigateToProblemParams = {
    circuitColor: string;
    subarea: string;
    order: number;
};

/**
 * Service that coordinates between map and problem stores
 * for actions that require both stores
 */
export const mapProblemService = {
    /**
     * Handles map tap by querying features and navigating to problem
     */
    async handleMapTap(point: { x: number; y: number }) {
        const { handleMapTap, flyToProblemCoordinates } = useMapStore.getState();
        const { createProblemFromMapFeature, setProblem, setViewProblem } = useProblemStore.getState();

        const feature = await handleMapTap(point);
        if (feature) {
            const problem = createProblemFromMapFeature(feature);
            if (problem) {
                setProblem(problem);
                setViewProblem(true);
                if (problem.coordinates) {
                    flyToProblemCoordinates(problem.coordinates);
                }
            }
        }
    },

    /**
     * Navigate to a specific problem (used by circuit navigation)
     */
    navigateToProblem(params: NavigateToProblemParams) {
        const { flyToProblemCoordinates } = useMapStore.getState();
        const { getProblem, setProblem, setViewProblem } = useProblemStore.getState();

        const problem = getProblem({
            circuitColor: params.circuitColor,
            subarea: params.subarea,
            order: params.order,
        });
        if (problem) {
            setProblem(problem);
            setViewProblem(true);
            if (problem.coordinates) {
                flyToProblemCoordinates(problem.coordinates);
            }
        }
    },

    /**
     * Show previous problem in circuit
     */
    showPreviousProblem() {
        const { flyToProblemCoordinates } = useMapStore.getState();
        const { problem, showPreviousProblem } = useProblemStore.getState();

        const previousProblem = problem;
        showPreviousProblem();

        // Get the updated problem and fly to it
        const { problem: newProblem } = useProblemStore.getState();
        if (newProblem && newProblem !== previousProblem && newProblem.coordinates) {
            flyToProblemCoordinates(newProblem.coordinates);
        }
    },

    /**
     * Show next problem in circuit
     */
    showNextProblem() {
        const { flyToProblemCoordinates } = useMapStore.getState();
        const { problem, showNextProblem } = useProblemStore.getState();

        const previousProblem = problem;
        showNextProblem();

        // Get the updated problem and fly to it
        const { problem: newProblem } = useProblemStore.getState();
        if (newProblem && newProblem !== previousProblem && newProblem.coordinates) {
            flyToProblemCoordinates(newProblem.coordinates);
        }
    },
}

    