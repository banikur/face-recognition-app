'use server';

import {
    getAllRules,
    createRule,
    updateRule,
    deleteRule,
    getAllSkinTypes,
    getAllProducts,
    Rule,
    SkinType,
    Product
} from '@/data/models';

export async function getRulesAction(): Promise<Rule[]> {
    return await getAllRules();
}

export async function getSkinTypesAction(): Promise<SkinType[]> {
    return await getAllSkinTypes();
}

export async function getProductsAction(): Promise<Product[]> {
    return await getAllProducts();
}

export async function createRuleAction(rule: Omit<Rule, 'id'>): Promise<number> {
    return await createRule(rule);
}

export async function updateRuleAction(id: number, rule: Partial<Rule>): Promise<void> {
    return await updateRule(id, rule);
}

export async function deleteRuleAction(id: number): Promise<void> {
    return await deleteRule(id);
}
